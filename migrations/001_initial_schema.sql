-- Agent-Builder Web Application Database Schema
-- PostgreSQL 15+

-- Users table for SSO authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  sso_provider VARCHAR(50),  -- 'google', 'okta', 'azure', etc.
  sso_id VARCHAR(255),        -- Provider-specific user ID
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_sso_id ON users(sso_provider, sso_id);

-- User sessions for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,  -- SHA-256 hash of JWT
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- User API keys (encrypted at rest)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,  -- AES-256-GCM encrypted Anthropic API key
  iv VARCHAR(32) NOT NULL,      -- Initialization vector
  auth_tag VARCHAR(32) NOT NULL, -- Authentication tag for GCM
  is_valid BOOLEAN DEFAULT TRUE,
  last_validated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);

-- Agent creation sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_request TEXT NOT NULL,         -- Original user description
  status VARCHAR(50) NOT NULL,        -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  current_phase VARCHAR(50),          -- 'clarification', 'design', 'implementation', 'packaging', 'learning'
  progress FLOAT DEFAULT 0.0,         -- 0.0 to 1.0
  output_type VARCHAR(50),            -- 'skill', 'mcp', 'cli', 'library'
  language VARCHAR(50),               -- 'typescript', 'python'
  artifacts_s3_key VARCHAR(500),      -- S3 path to generated artifacts
  error TEXT,                         -- Error message if failed
  metadata JSONB,                     -- Additional metadata (clarifications, design decisions, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_phase CHECK (current_phase IN ('clarification', 'design', 'implementation', 'packaging', 'learning') OR current_phase IS NULL),
  CONSTRAINT valid_progress CHECK (progress >= 0.0 AND progress <= 1.0),
  CONSTRAINT valid_output_type CHECK (output_type IN ('skill', 'mcp', 'cli', 'library') OR output_type IS NULL),
  CONSTRAINT valid_language CHECK (language IN ('typescript', 'python') OR language IS NULL)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_completed_at ON sessions(completed_at DESC NULLS LAST);

-- Audit log for security and debugging
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,  -- 'login', 'logout', 'create_session', 'download', 'api_key_add', etc.
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_session_id ON audit_log(session_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired sessions (to be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete user_sessions that have expired
  DELETE FROM user_sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for old completed sessions (7-day retention)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions older than 7 days that are completed or failed
  DELETE FROM sessions
  WHERE completed_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed', 'cancelled');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View for active sessions with user info
CREATE OR REPLACE VIEW active_sessions_view AS
SELECT
  s.id,
  s.user_id,
  u.email AS user_email,
  u.name AS user_name,
  s.user_request,
  s.status,
  s.current_phase,
  s.progress,
  s.output_type,
  s.language,
  s.created_at,
  s.updated_at,
  EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 60 AS duration_minutes
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.status IN ('pending', 'in_progress')
ORDER BY s.created_at DESC;

-- View for session statistics per user
CREATE OR REPLACE VIEW user_session_stats AS
SELECT
  user_id,
  COUNT(*) AS total_sessions,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_sessions,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_sessions,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_sessions,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) FILTER (WHERE status = 'completed') AS avg_duration_minutes,
  MAX(created_at) AS last_session_at
FROM sessions
GROUP BY user_id;

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts authenticated via SSO';
COMMENT ON TABLE user_sessions IS 'Active JWT sessions for authenticated users';
COMMENT ON TABLE user_api_keys IS 'Encrypted Anthropic API keys per user';
COMMENT ON TABLE sessions IS 'Agent creation sessions with progress tracking';
COMMENT ON TABLE audit_log IS 'Security and activity audit trail';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes expired JWT sessions';
COMMENT ON FUNCTION cleanup_old_sessions() IS 'Removes completed sessions older than 7 days';
