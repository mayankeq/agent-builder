-- Multi-LLM Provider Support
-- Extends user_api_keys to support multiple providers

-- Drop the existing constraint if it exists
ALTER TABLE user_api_keys DROP CONSTRAINT IF EXISTS one_key_per_user;

-- Add provider column to user_api_keys
ALTER TABLE user_api_keys
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'claude';

-- Add unique constraint: one key per user per provider
ALTER TABLE user_api_keys
ADD CONSTRAINT unique_user_provider UNIQUE (user_id, provider);

-- Add check constraint for valid providers
ALTER TABLE user_api_keys
ADD CONSTRAINT valid_provider CHECK (
  provider IN ('claude', 'openai', 'azure-openai', 'gemini')
);

-- Add model preference column
ALTER TABLE user_api_keys
ADD COLUMN IF NOT EXISTS preferred_model VARCHAR(100);

-- Add provider-specific configuration (JSON)
ALTER TABLE user_api_keys
ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb;

-- Update sessions table to track which provider was used
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(20) DEFAULT 'claude';

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100);

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS tokens_input INTEGER DEFAULT 0;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 4) DEFAULT 0.0;

-- Create index for provider analytics
CREATE INDEX IF NOT EXISTS idx_sessions_provider ON sessions(llm_provider);

-- Provider usage statistics view
CREATE OR REPLACE VIEW provider_usage_stats AS
SELECT
  llm_provider,
  COUNT(*) AS total_sessions,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_sessions,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_sessions,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS success_rate,
  SUM(tokens_input) AS total_input_tokens,
  SUM(tokens_output) AS total_output_tokens,
  SUM(estimated_cost) AS total_cost,
  AVG(estimated_cost) FILTER (WHERE status = 'completed') AS avg_cost_per_agent,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) FILTER (WHERE status = 'completed') AS avg_duration_minutes
FROM sessions
WHERE llm_provider IS NOT NULL
GROUP BY llm_provider
ORDER BY total_sessions DESC;

-- User provider preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_provider VARCHAR(20) DEFAULT 'claude',
  preferred_models JSONB DEFAULT '{}'::jsonb, -- {"claude": "claude-sonnet-4-5", "openai": "gpt-4-turbo"}
  auto_select_provider BOOLEAN DEFAULT FALSE, -- Automatically choose cheapest available provider
  max_cost_per_agent DECIMAL(10, 2), -- Maximum willing to spend per agent
  preferences JSONB DEFAULT '{}'::jsonb, -- Other user preferences
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_default_provider CHECK (
    default_provider IN ('claude', 'openai', 'azure-openai', 'gemini')
  )
);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Provider compatibility matrix
CREATE TABLE IF NOT EXISTS provider_features (
  provider VARCHAR(20) PRIMARY KEY,
  supports_extended_thinking BOOLEAN DEFAULT FALSE,
  supports_streaming BOOLEAN DEFAULT TRUE,
  max_tokens INTEGER,
  input_cost_per_1m DECIMAL(10, 4), -- Cost per 1M input tokens
  output_cost_per_1m DECIMAL(10, 4), -- Cost per 1M output tokens
  avg_latency_ms INTEGER, -- Average API latency
  availability_score DECIMAL(3, 2), -- 0.0 to 1.0
  documentation_url TEXT,
  features JSONB DEFAULT '{}'::jsonb
);

-- Insert initial provider data
INSERT INTO provider_features (
  provider, supports_extended_thinking, supports_streaming, max_tokens,
  input_cost_per_1m, output_cost_per_1m, avg_latency_ms, availability_score,
  documentation_url
) VALUES
  ('claude', TRUE, TRUE, 200000, 3.00, 15.00, 2500, 0.99, 'https://docs.anthropic.com'),
  ('openai', FALSE, TRUE, 128000, 10.00, 30.00, 1500, 0.98, 'https://platform.openai.com/docs'),
  ('azure-openai', FALSE, TRUE, 128000, 10.00, 30.00, 2000, 0.99, 'https://learn.microsoft.com/azure/ai-services/openai'),
  ('gemini', FALSE, TRUE, 1000000, 0.50, 1.50, 3000, 0.95, 'https://ai.google.dev/docs')
ON CONFLICT (provider) DO UPDATE SET
  input_cost_per_1m = EXCLUDED.input_cost_per_1m,
  output_cost_per_1m = EXCLUDED.output_cost_per_1m,
  avg_latency_ms = EXCLUDED.avg_latency_ms;

-- Function to recommend provider based on user preferences and availability
CREATE OR REPLACE FUNCTION recommend_provider(
  p_user_id UUID,
  p_estimated_tokens INTEGER DEFAULT 40000
)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_user_pref user_preferences%ROWTYPE;
  v_available_providers TEXT[];
  v_recommended VARCHAR(20);
BEGIN
  -- Get user preferences
  SELECT * INTO v_user_pref
  FROM user_preferences
  WHERE user_id = p_user_id;

  -- Get available providers (where user has API key)
  SELECT array_agg(provider) INTO v_available_providers
  FROM user_api_keys
  WHERE user_id = p_user_id AND is_valid = TRUE;

  -- If user has default provider and it's available, use it
  IF v_user_pref.default_provider = ANY(v_available_providers) THEN
    RETURN v_user_pref.default_provider;
  END IF;

  -- If auto-select is enabled, choose cheapest available provider
  IF v_user_pref.auto_select_provider THEN
    SELECT provider INTO v_recommended
    FROM provider_features
    WHERE provider = ANY(v_available_providers)
    ORDER BY (input_cost_per_1m + output_cost_per_1m) ASC
    LIMIT 1;

    IF v_recommended IS NOT NULL THEN
      RETURN v_recommended;
    END IF;
  END IF;

  -- Default to Claude if available
  IF 'claude' = ANY(v_available_providers) THEN
    RETURN 'claude';
  END IF;

  -- Return first available provider
  IF array_length(v_available_providers, 1) > 0 THEN
    RETURN v_available_providers[1];
  END IF;

  -- No providers available
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_api_keys IS 'API keys for multiple LLM providers per user';
COMMENT ON TABLE user_preferences IS 'User preferences for LLM provider selection';
COMMENT ON TABLE provider_features IS 'Feature matrix and pricing for all supported providers';
COMMENT ON FUNCTION recommend_provider IS 'Recommend best LLM provider based on user preferences and availability';
