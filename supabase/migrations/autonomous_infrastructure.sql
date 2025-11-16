-- ============================================================
-- AUTONOMOUS INFRASTRUCTURE
-- ============================================================
-- Database schema for self-healing system and evolving agents
-- Part of NØID Labs hands-free ecosystem
--
-- Tables:
-- 1. incidents - System incidents and auto-resolutions
-- 2. recovery_strategies - Self-healing strategies
-- 3. agent_profiles - Evolving agent profiles
-- 4. agent_interactions - Agent learning data
-- 5. learning_patterns - Learned response patterns
-- 
-- NO additional infrastructure cost - uses existing Supabase
-- ============================================================

-- ============================================================
-- INCIDENTS (Self-Healing)
-- ============================================================

CREATE TABLE IF NOT EXISTS incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  component TEXT NOT NULL, -- 'ai_client', 'database', 'cache', etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  auto_resolved BOOLEAN DEFAULT false,
  requires_human BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  recovery_actions TEXT[] DEFAULT '{}'::TEXT[],
  resolution_time_ms INTEGER, -- Time to resolution
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_app ON incidents(app);
CREATE INDEX IF NOT EXISTS idx_incidents_component ON incidents(component);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_auto_resolved ON incidents(auto_resolved);
CREATE INDEX IF NOT EXISTS idx_incidents_requires_human ON incidents(requires_human) WHERE requires_human = true;
CREATE INDEX IF NOT EXISTS idx_incidents_detected ON incidents(detected_at DESC);

-- ============================================================
-- RECOVERY STRATEGIES
-- ============================================================

CREATE TABLE IF NOT EXISTS recovery_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  component TEXT NOT NULL,
  priority INTEGER DEFAULT 50,
  confidence DECIMAL(5,2) DEFAULT 50,
  success_rate DECIMAL(5,2) DEFAULT 50,
  times_used INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recovery_component ON recovery_strategies(component);
CREATE INDEX IF NOT EXISTS idx_recovery_priority ON recovery_strategies(priority DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_success_rate ON recovery_strategies(success_rate DESC);

-- ============================================================
-- AGENT PROFILES (Evolving Agents)
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('sales', 'support', 'service', 'creative', 'analyst')),
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  expertise_level DECIMAL(5,2) DEFAULT 50 CHECK (expertise_level >= 0 AND expertise_level <= 100),
  total_interactions INTEGER DEFAULT 0,
  successful_interactions INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100,
  confidence_threshold DECIMAL(5,2) DEFAULT 75,
  specializations TEXT[] DEFAULT '{}'::TEXT[],
  learning_rate DECIMAL(3,2) DEFAULT 0.5,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, app)
);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_role ON agent_profiles(role);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_app ON agent_profiles(app);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_expertise ON agent_profiles(expertise_level DESC);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_version ON agent_profiles(version DESC);

-- ============================================================
-- AGENT INTERACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_profiles(id),
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  escalated BOOLEAN DEFAULT false,
  resolution_quality DECIMAL(5,2) DEFAULT 80,
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_interactions_agent ON agent_interactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_feedback ON agent_interactions(user_feedback);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_escalated ON agent_interactions(escalated);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_quality ON agent_interactions(resolution_quality DESC);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_created ON agent_interactions(created_at DESC);

-- ============================================================
-- LEARNING PATTERNS
-- ============================================================

CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_profiles(id),
  pattern_type TEXT NOT NULL,
  input_pattern TEXT NOT NULL,
  successful_output TEXT NOT NULL,
  success_count INTEGER DEFAULT 1,
  failure_count INTEGER DEFAULT 0,
  confidence DECIMAL(5,2) DEFAULT 50,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, input_pattern)
);

CREATE INDEX IF NOT EXISTS idx_learning_patterns_agent ON learning_patterns(agent_id);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_confidence ON learning_patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_success ON learning_patterns(success_count DESC);

-- ============================================================
-- VIEWS
-- ============================================================

-- System health overview
CREATE OR REPLACE VIEW system_health_overview AS
SELECT 
  app,
  component,
  COUNT(*) as total_incidents,
  COUNT(*) FILTER (WHERE auto_resolved = true) as auto_resolved_count,
  COUNT(*) FILTER (WHERE requires_human = true) as escalated_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE auto_resolved = true) / NULLIF(COUNT(*), 0), 2) as auto_resolution_rate,
  ROUND(AVG(resolution_time_ms), 0) as avg_resolution_time_ms,
  MAX(detected_at) as last_incident
FROM incidents
WHERE detected_at >= now() - INTERVAL '7 days'
GROUP BY app, component;

-- Agent performance overview
CREATE OR REPLACE VIEW agent_performance_overview AS
SELECT 
  ap.id,
  ap.role,
  ap.app,
  ap.expertise_level,
  ap.total_interactions,
  ap.success_rate,
  ap.version,
  COUNT(ai.id) as recent_interactions,
  ROUND(AVG(ai.resolution_quality), 2) as avg_quality,
  COUNT(ai.id) FILTER (WHERE ai.user_feedback = 'positive') as positive_feedback_count,
  COUNT(ai.id) FILTER (WHERE ai.escalated = true) as escalation_count,
  COUNT(lp.id) as learned_patterns_count
FROM agent_profiles ap
LEFT JOIN agent_interactions ai ON ap.id = ai.agent_id AND ai.created_at >= now() - INTERVAL '7 days'
LEFT JOIN learning_patterns lp ON ap.id = lp.agent_id AND lp.confidence >= 70
GROUP BY ap.id, ap.role, ap.app, ap.expertise_level, ap.total_interactions, ap.success_rate, ap.version;

-- Recovery strategy effectiveness
CREATE OR REPLACE VIEW recovery_strategy_effectiveness AS
SELECT 
  name,
  component,
  priority,
  success_rate,
  times_used,
  times_successful,
  ROUND(100.0 * times_successful / NULLIF(times_used, 0), 2) as actual_success_rate,
  last_used
FROM recovery_strategies
WHERE enabled = true
ORDER BY success_rate DESC, times_used DESC;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Record incident resolution time
CREATE OR REPLACE FUNCTION calculate_incident_resolution_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    NEW.resolution_time_ms := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.detected_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_resolution_time
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_incident_resolution_time();

-- Update recovery strategy stats
CREATE OR REPLACE FUNCTION update_recovery_strategy_stats(
  p_strategy_name TEXT,
  p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE recovery_strategies
  SET 
    times_used = times_used + 1,
    times_successful = times_successful + CASE WHEN p_success THEN 1 ELSE 0 END,
    success_rate = ROUND(100.0 * (times_successful + CASE WHEN p_success THEN 1 ELSE 0 END) / (times_used + 1), 2),
    last_used = now(),
    updated_at = now()
  WHERE name = p_strategy_name;
END;
$$ LANGUAGE plpgsql;

-- Update agent after interaction
CREATE OR REPLACE FUNCTION update_agent_after_interaction()
RETURNS TRIGGER AS $$
DECLARE
  v_success BOOLEAN;
BEGIN
  -- Determine if interaction was successful
  v_success := (
    NEW.user_feedback = 'positive' OR 
    (NEW.user_feedback IS NULL AND NOT NEW.escalated AND NEW.resolution_quality >= 80)
  );

  -- Update agent profile
  UPDATE agent_profiles
  SET 
    total_interactions = total_interactions + 1,
    successful_interactions = successful_interactions + CASE WHEN v_success THEN 1 ELSE 0 END,
    success_rate = ROUND(100.0 * (successful_interactions + CASE WHEN v_success THEN 1 ELSE 0 END) / (total_interactions + 1), 2),
    updated_at = now()
  WHERE id = NEW.agent_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_after_interaction
  AFTER INSERT OR UPDATE OF user_feedback ON agent_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_after_interaction();

-- Get agent recommendations (for fleet optimization)
CREATE OR REPLACE FUNCTION get_agent_recommendations(
  p_app TEXT,
  p_min_expertise DECIMAL DEFAULT 70
)
RETURNS TABLE(
  agent_id TEXT,
  role TEXT,
  expertise_level DECIMAL,
  success_rate DECIMAL,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.role,
    ap.expertise_level,
    ap.success_rate,
    CASE 
      WHEN ap.expertise_level >= 90 AND ap.success_rate >= 95 THEN 'Authority-level - ready for complex cases'
      WHEN ap.expertise_level >= 75 AND ap.success_rate >= 85 THEN 'Expert-level - performing excellently'
      WHEN ap.expertise_level >= 60 AND ap.success_rate >= 75 THEN 'Proficient - continue learning'
      WHEN ap.success_rate < 70 THEN 'Needs improvement - review patterns'
      ELSE 'Developing - monitor closely'
    END as recommendation
  FROM agent_profiles ap
  WHERE ap.app = p_app
    AND ap.expertise_level >= p_min_expertise
  ORDER BY ap.expertise_level DESC, ap.success_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Get system autonomy score (0-100)
CREATE OR REPLACE FUNCTION get_autonomy_score(p_app TEXT)
RETURNS TABLE(
  autonomy_score DECIMAL,
  auto_resolution_rate DECIMAL,
  agent_avg_expertise DECIMAL,
  human_intervention_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(
      (COALESCE(incident_auto_rate, 0) * 0.5) +
      (COALESCE(agent_expertise, 50) * 0.5),
      2
    ) as autonomy_score,
    COALESCE(incident_auto_rate, 0) as auto_resolution_rate,
    COALESCE(agent_expertise, 50) as agent_avg_expertise,
    ROUND(100 - COALESCE(incident_auto_rate, 100), 2) as human_intervention_rate
  FROM (
    SELECT 
      ROUND(100.0 * COUNT(*) FILTER (WHERE auto_resolved = true) / NULLIF(COUNT(*), 0), 2) as incident_auto_rate
    FROM incidents
    WHERE app = p_app
      AND detected_at >= now() - INTERVAL '30 days'
  ) incidents
  CROSS JOIN (
    SELECT 
      ROUND(AVG(expertise_level), 2) as agent_expertise
    FROM agent_profiles
    WHERE app = p_app
  ) agents;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to incidents"
  ON incidents FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to recovery_strategies"
  ON recovery_strategies FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to agent_profiles"
  ON agent_profiles FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to agent_interactions"
  ON agent_interactions FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to learning_patterns"
  ON learning_patterns FOR ALL TO service_role USING (true);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE incidents IS 'System incidents and self-healing resolutions';
COMMENT ON TABLE recovery_strategies IS 'Auto-healing recovery strategies';
COMMENT ON TABLE agent_profiles IS 'Evolving agent profiles with learning capabilities';
COMMENT ON TABLE agent_interactions IS 'Agent interactions for continuous learning';
COMMENT ON TABLE learning_patterns IS 'Learned response patterns for fast retrieval';

COMMENT ON VIEW system_health_overview IS 'System health metrics by component';
COMMENT ON VIEW agent_performance_overview IS 'Agent performance metrics';
COMMENT ON VIEW recovery_strategy_effectiveness IS 'Recovery strategy success rates';

COMMENT ON FUNCTION get_autonomy_score(TEXT) IS 'Calculate system autonomy score (0-100)';
COMMENT ON FUNCTION get_agent_recommendations(TEXT, DECIMAL) IS 'Get agent performance recommendations';

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert default recovery strategies
INSERT INTO recovery_strategies (name, component, priority, confidence, success_rate, enabled)
VALUES
  ('cache_fallback', 'ai_client', 100, 95, 95, true),
  ('mock_mode', 'ai_client', 80, 90, 90, true),
  ('connection_retry', 'database', 100, 85, 80, true),
  ('cache_clear', 'cache', 90, 95, 95, true),
  ('workflow_simplify', 'workflows', 85, 80, 75, true)
ON CONFLICT (name) DO NOTHING;
