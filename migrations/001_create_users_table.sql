-- Users table for Google OAuth authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture VARCHAR(512),
    domain VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_domain ON users(domain);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- Sessions table for agent creation tracking
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    output_format VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for agent sessions
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at ON agent_sessions(created_at DESC);

-- Audit log for security
CREATE TABLE IF NOT EXISTS auth_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON auth_logs(success);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for agent_sessions
CREATE TRIGGER update_agent_sessions_updated_at
    BEFORE UPDATE ON agent_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'Authenticated users with domain-restricted Google OAuth';
COMMENT ON TABLE agent_sessions IS 'Agent creation sessions with progress tracking';
COMMENT ON TABLE auth_logs IS 'Security audit log for authentication attempts';
