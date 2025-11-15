-- ============================================================
-- INTELLIGENCE GATHERING TABLES
-- ============================================================
-- Tables for tracking AI operations, recipe usage, and optimization
-- Part of RPRD DNA cost optimization strategy
--
-- NO additional infrastructure cost - uses existing Supabase instance
-- ============================================================

-- Intelligence logs: Track all AI operations
CREATE TABLE IF NOT EXISTS intelligence_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  operation TEXT NOT NULL, -- e.g., 'generate_content', 'refine_copy', 'ab_test'
  task_type TEXT, -- e.g., 'creative', 'structural', 'refine'
  model_used TEXT, -- e.g., 'claude-3-5-sonnet-20241022'
  model_tier TEXT CHECK (model_tier IN ('premium', 'standard', 'cheap')),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  version_selected INTEGER, -- For A/B testing: which version was chosen (0-indexed)
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_app ON intelligence_logs(app);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_operation ON intelligence_logs(operation);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_created_at ON intelligence_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_app_created ON intelligence_logs(app, created_at DESC);

-- Recipe usage: Track which patterns/recipes work best
CREATE TABLE IF NOT EXISTS recipe_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_type TEXT NOT NULL, -- e.g., 'email_template', 'social_hook', 'campaign_structure'
  recipe_name TEXT NOT NULL, -- Specific recipe identifier
  app TEXT NOT NULL,
  use_count INTEGER DEFAULT 1,
  success_rate DECIMAL(5,2), -- Percentage (0-100)
  last_used TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recipe_type, recipe_name, app)
);

-- Indexes for recipe queries
CREATE INDEX IF NOT EXISTS idx_recipe_usage_type ON recipe_usage(recipe_type);
CREATE INDEX IF NOT EXISTS idx_recipe_usage_count ON recipe_usage(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_usage_app ON recipe_usage(app);

-- Content performance: Track which outputs perform best
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'email', 'social', 'script', 'campaign'
  content_id TEXT, -- Reference to the actual content (optional)
  version TEXT, -- 'A', 'B', etc. for A/B testing
  engagement_score DECIMAL(5,2), -- 0-100 scale
  conversion_score DECIMAL(5,2), -- 0-100 scale
  selected_by_user BOOLEAN DEFAULT false, -- Did user pick this version?
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_performance_app ON content_performance(app);
CREATE INDEX IF NOT EXISTS idx_content_performance_type ON content_performance(content_type);
CREATE INDEX IF NOT EXISTS idx_content_performance_score ON content_performance(engagement_score DESC);

-- View: Intelligence summary by app
CREATE OR REPLACE VIEW intelligence_summary AS
SELECT 
  app,
  COUNT(*) as total_operations,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_operations,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(input_tokens + output_tokens) as total_tokens,
  COUNT(DISTINCT operation) as unique_operations,
  MAX(created_at) as last_operation
FROM intelligence_logs
GROUP BY app;

-- View: Top recipes by success
CREATE OR REPLACE VIEW top_recipes AS
SELECT 
  recipe_type,
  recipe_name,
  app,
  use_count,
  success_rate,
  last_used
FROM recipe_usage
ORDER BY use_count DESC, success_rate DESC
LIMIT 50;

-- Function: Log AI operation (convenience function)
CREATE OR REPLACE FUNCTION log_ai_operation(
  p_app TEXT,
  p_operation TEXT,
  p_model_used TEXT DEFAULT NULL,
  p_model_tier TEXT DEFAULT NULL,
  p_input_tokens INTEGER DEFAULT 0,
  p_output_tokens INTEGER DEFAULT 0,
  p_success BOOLEAN DEFAULT true,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO intelligence_logs (
    app, operation, model_used, model_tier, 
    input_tokens, output_tokens, success, metadata
  )
  VALUES (
    p_app, p_operation, p_model_used, p_model_tier,
    p_input_tokens, p_output_tokens, p_success, p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions (adjust based on your RLS setup)
-- These tables are primarily for internal analytics, not user-facing
ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to intelligence_logs" 
  ON intelligence_logs FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Service role full access to recipe_usage" 
  ON recipe_usage FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Service role full access to content_performance" 
  ON content_performance FOR ALL 
  TO service_role 
  USING (true);

-- Comments for documentation
COMMENT ON TABLE intelligence_logs IS 'Tracks all AI operations for cost optimization and intelligence gathering';
COMMENT ON TABLE recipe_usage IS 'Tracks which content patterns/recipes are most successful';
COMMENT ON TABLE content_performance IS 'Tracks performance metrics of generated content';
COMMENT ON VIEW intelligence_summary IS 'Summary of AI operations by app';
COMMENT ON VIEW top_recipes IS 'Most frequently used and successful recipes';
