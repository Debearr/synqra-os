-- ============================================================
-- RPRD DNA INFRASTRUCTURE
-- ============================================================
-- Complete database schema for intelligent, cost-optimized system
-- Part of NØID Labs ecosystem upgrade
--
-- Tables:
-- 1. cache_entries - Intelligent content caching
-- 2. optimization_rules - Auto-learned optimization rules
-- 3. optimization_logs - Track optimization applications
-- 
-- NO additional infrastructure cost - uses existing Supabase
-- ============================================================

-- ============================================================
-- CACHE ENTRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  namespace TEXT NOT NULL DEFAULT 'default',
  key TEXT NOT NULL,
  fingerprint TEXT NOT NULL, -- SHA256 hash for quick lookup
  value JSONB NOT NULL,
  hits INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100,
  performance_score DECIMAL(5,2) DEFAULT 80, -- 0-100 scale
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(namespace, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_cache_namespace ON cache_entries(namespace);
CREATE INDEX IF NOT EXISTS idx_cache_fingerprint ON cache_entries(fingerprint);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_performance ON cache_entries(performance_score DESC);

-- Function to increment cache hits
CREATE OR REPLACE FUNCTION increment_cache_hits(cache_fingerprint TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE cache_entries
  SET 
    hits = hits + 1,
    last_accessed = now()
  WHERE fingerprint = cache_fingerprint;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- OPTIMIZATION RULES
-- ============================================================

CREATE TABLE IF NOT EXISTS optimization_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  category TEXT NOT NULL CHECK (category IN ('model_selection', 'prompt', 'workflow', 'cache', 'retry')),
  condition TEXT NOT NULL, -- Human-readable condition
  action TEXT NOT NULL, -- Human-readable action
  confidence DECIMAL(5,2) DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  performance_gain DECIMAL(5,2) DEFAULT 0, -- Percentage improvement
  applied_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_applied TIMESTAMPTZ,
  UNIQUE(app, category, condition)
);

CREATE INDEX IF NOT EXISTS idx_optimization_app ON optimization_rules(app);
CREATE INDEX IF NOT EXISTS idx_optimization_category ON optimization_rules(category);
CREATE INDEX IF NOT EXISTS idx_optimization_confidence ON optimization_rules(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_enabled ON optimization_rules(enabled) WHERE enabled = true;

-- ============================================================
-- OPTIMIZATION LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS optimization_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL,
  type TEXT NOT NULL, -- 'model', 'prompt', 'workflow', 'cache'
  description TEXT NOT NULL,
  expected_gain DECIMAL(5,2),
  confidence DECIMAL(5,2),
  applied BOOLEAN DEFAULT false,
  actual_gain DECIMAL(5,2), -- Measured after application
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_optimization_logs_app ON optimization_logs(app);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_applied ON optimization_logs(applied);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_created ON optimization_logs(created_at DESC);

-- ============================================================
-- VIEWS
-- ============================================================

-- Cache performance by namespace
CREATE OR REPLACE VIEW cache_performance AS
SELECT 
  namespace,
  COUNT(*) as total_entries,
  SUM(hits) as total_hits,
  ROUND(AVG(performance_score), 2) as avg_performance,
  ROUND(AVG(success_rate), 2) as avg_success_rate,
  COUNT(*) FILTER (WHERE expires_at < now()) as expired_entries,
  COUNT(*) FILTER (WHERE performance_score >= 80) as high_performers,
  MAX(last_accessed) as most_recent_access
FROM cache_entries
GROUP BY namespace;

-- Optimization effectiveness
CREATE OR REPLACE VIEW optimization_effectiveness AS
SELECT 
  app,
  category,
  COUNT(*) as total_rules,
  COUNT(*) FILTER (WHERE enabled = true) as enabled_rules,
  ROUND(AVG(confidence), 2) as avg_confidence,
  ROUND(AVG(performance_gain), 2) as avg_gain,
  SUM(applied_count) as total_applications,
  ROUND(AVG(success_rate), 2) as avg_success_rate
FROM optimization_rules
GROUP BY app, category;

-- Recent optimization wins
CREATE OR REPLACE VIEW recent_optimizations AS
SELECT 
  app,
  type,
  description,
  expected_gain,
  actual_gain,
  confidence,
  created_at
FROM optimization_logs
WHERE applied = true
  AND created_at >= now() - INTERVAL '30 days'
ORDER BY actual_gain DESC NULLS LAST, expected_gain DESC
LIMIT 50;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Clean expired cache entries (call periodically)
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  v_deleted_count BIGINT;
BEGIN
  DELETE FROM cache_entries
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Get top performing cache entries
CREATE OR REPLACE FUNCTION get_top_cache_entries(
  p_namespace TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  key TEXT,
  hits INTEGER,
  performance_score DECIMAL,
  success_rate DECIMAL,
  last_accessed TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.key,
    c.hits,
    c.performance_score,
    c.success_rate,
    c.last_accessed
  FROM cache_entries c
  WHERE c.namespace = p_namespace
    AND c.expires_at > now()
  ORDER BY c.performance_score DESC, c.hits DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Apply optimization rule
CREATE OR REPLACE FUNCTION apply_optimization_rule(p_rule_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := true;
BEGIN
  -- Update applied count and timestamp
  UPDATE optimization_rules
  SET 
    applied_count = applied_count + 1,
    last_applied = now()
  WHERE id = p_rule_id;
  
  RETURN v_success;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to cache_entries"
  ON cache_entries FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access to optimization_rules"
  ON optimization_rules FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access to optimization_logs"
  ON optimization_logs FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE cache_entries IS 'Intelligent content cache with performance tracking';
COMMENT ON TABLE optimization_rules IS 'Auto-learned optimization rules for system improvement';
COMMENT ON TABLE optimization_logs IS 'Log of optimization applications and effectiveness';

COMMENT ON VIEW cache_performance IS 'Cache performance metrics by namespace';
COMMENT ON VIEW optimization_effectiveness IS 'Optimization rule effectiveness by app and category';
COMMENT ON VIEW recent_optimizations IS 'Recent successful optimizations';

COMMENT ON FUNCTION clean_expired_cache() IS 'Remove expired cache entries';
COMMENT ON FUNCTION get_top_cache_entries(TEXT, INTEGER) IS 'Get top performing cache entries for a namespace';
COMMENT ON FUNCTION apply_optimization_rule(UUID) IS 'Mark an optimization rule as applied';

-- ============================================================
-- INITIAL DATA / DEFAULTS
-- ============================================================

-- Insert default optimization rules (starter pack)
INSERT INTO optimization_rules (app, category, condition, action, confidence, performance_gain, enabled)
VALUES
  ('shared', 'model_selection', 'task_type = ''refine''', 'use_tier = ''cheap''', 95, 70, true),
  ('shared', 'model_selection', 'task_type = ''formatting''', 'use_tier = ''cheap''', 95, 70, true),
  ('shared', 'cache', 'hit_rate < 30', 'adjust_similarity_threshold = 0.8', 80, 40, true),
  ('shared', 'workflow', 'step_duration > 5000', 'enable_caching = true', 75, 80, true)
ON CONFLICT (app, category, condition) DO NOTHING;
