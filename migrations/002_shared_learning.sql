-- Shared Learning System for Agent-Builder
-- Allows users to benefit from collective learnings

-- Learning patterns extracted from successful sessions
CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(50) NOT NULL, -- 'requirement', 'architecture', 'implementation', 'common_issue'
  similarity_hash VARCHAR(64) NOT NULL, -- Hash of the pattern for deduplication
  pattern_data JSONB NOT NULL, -- The actual pattern (requirements, solution, etc.)
  source_sessions UUID[] DEFAULT '{}', -- Array of session IDs that contributed
  usage_count INTEGER DEFAULT 0, -- How many times this pattern was helpful
  success_rate FLOAT DEFAULT 0.0, -- Success rate when applied
  avg_tokens_saved INTEGER DEFAULT 0, -- Average tokens saved by reusing
  tags TEXT[] DEFAULT '{}', -- Tags for categorization
  metadata JSONB, -- Additional context
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_pattern_type CHECK (pattern_type IN ('requirement', 'architecture', 'implementation', 'common_issue', 'optimization', 'best_practice'))
);

CREATE INDEX idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX idx_learning_patterns_hash ON learning_patterns(similarity_hash);
CREATE INDEX idx_learning_patterns_tags ON learning_patterns USING GIN(tags);
CREATE INDEX idx_learning_patterns_usage ON learning_patterns(usage_count DESC);
CREATE INDEX idx_learning_patterns_success ON learning_patterns(success_rate DESC);

-- Pattern suggestions for new requests
CREATE TABLE IF NOT EXISTS pattern_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  pattern_id UUID NOT NULL REFERENCES learning_patterns(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL, -- 0.0 to 1.0
  suggested_at TIMESTAMP DEFAULT NOW(),
  user_feedback VARCHAR(20), -- 'accepted', 'rejected', 'modified'
  applied BOOLEAN DEFAULT FALSE,
  tokens_saved INTEGER,
  CONSTRAINT valid_similarity CHECK (similarity_score >= 0.0 AND similarity_score <= 1.0),
  CONSTRAINT valid_feedback CHECK (user_feedback IN ('accepted', 'rejected', 'modified') OR user_feedback IS NULL)
);

CREATE INDEX idx_pattern_suggestions_session ON pattern_suggestions(session_id);
CREATE INDEX idx_pattern_suggestions_pattern ON pattern_suggestions(pattern_id);
CREATE INDEX idx_pattern_suggestions_similarity ON pattern_suggestions(similarity_score DESC);

-- Learning feedback from users
CREATE TABLE IF NOT EXISTS learning_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES learning_patterns(id) ON DELETE SET NULL,
  feedback_type VARCHAR(20) NOT NULL, -- 'helpful', 'not_helpful', 'incorrect'
  rating INTEGER, -- 1-5 stars
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('helpful', 'not_helpful', 'incorrect', 'suggestion')),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_learning_feedback_session ON learning_feedback(session_id);
CREATE INDEX idx_learning_feedback_pattern ON learning_feedback(pattern_id);
CREATE INDEX idx_learning_feedback_type ON learning_feedback(feedback_type);

-- Trigger to update learning patterns
CREATE OR REPLACE FUNCTION update_learning_pattern_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_feedback = 'accepted' AND NEW.applied = TRUE THEN
    UPDATE learning_patterns
    SET
      usage_count = usage_count + 1,
      updated_at = NOW()
    WHERE id = NEW.pattern_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pattern_stats_on_suggestion
  AFTER UPDATE ON pattern_suggestions
  FOR EACH ROW
  WHEN (NEW.user_feedback IS NOT NULL AND OLD.user_feedback IS NULL)
  EXECUTE FUNCTION update_learning_pattern_stats();

-- Function to find similar patterns
CREATE OR REPLACE FUNCTION find_similar_patterns(
  p_user_request TEXT,
  p_output_type VARCHAR(50),
  p_language VARCHAR(50),
  p_similarity_threshold FLOAT DEFAULT 0.7,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  pattern_id UUID,
  pattern_type VARCHAR(50),
  pattern_data JSONB,
  similarity_score FLOAT,
  usage_count INTEGER,
  success_rate FLOAT
) AS $$
BEGIN
  -- This is a simplified version
  -- In production, you'd use vector embeddings and cosine similarity
  -- For now, we'll use tag matching and usage statistics
  RETURN QUERY
  SELECT
    lp.id,
    lp.pattern_type,
    lp.pattern_data,
    0.8 AS similarity_score, -- Placeholder for actual similarity calculation
    lp.usage_count,
    lp.success_rate
  FROM learning_patterns lp
  WHERE
    lp.success_rate > 0.5
    AND (
      p_output_type = ANY(lp.tags)
      OR p_language = ANY(lp.tags)
    )
  ORDER BY lp.usage_count DESC, lp.success_rate DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- View for pattern analytics
CREATE OR REPLACE VIEW pattern_analytics AS
SELECT
  lp.id,
  lp.pattern_type,
  lp.similarity_hash,
  lp.usage_count,
  lp.success_rate,
  lp.avg_tokens_saved,
  array_length(lp.source_sessions, 1) AS contributing_sessions,
  COUNT(ps.id) AS total_suggestions,
  COUNT(ps.id) FILTER (WHERE ps.user_feedback = 'accepted') AS accepted_count,
  COUNT(ps.id) FILTER (WHERE ps.user_feedback = 'rejected') AS rejected_count,
  ROUND(
    COUNT(ps.id) FILTER (WHERE ps.user_feedback = 'accepted')::NUMERIC /
    NULLIF(COUNT(ps.id), 0) * 100,
    2
  ) AS acceptance_rate,
  AVG(lf.rating) FILTER (WHERE lf.rating IS NOT NULL) AS avg_rating,
  lp.created_at,
  lp.updated_at
FROM learning_patterns lp
LEFT JOIN pattern_suggestions ps ON lp.id = ps.pattern_id
LEFT JOIN learning_feedback lf ON lp.id = lf.pattern_id
GROUP BY lp.id;

COMMENT ON TABLE learning_patterns IS 'Shared learning patterns from successful agent builds';
COMMENT ON TABLE pattern_suggestions IS 'Pattern suggestions made to users during agent creation';
COMMENT ON TABLE learning_feedback IS 'User feedback on pattern suggestions';
COMMENT ON FUNCTION find_similar_patterns IS 'Find similar patterns based on user request';
