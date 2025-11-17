-- ════════════════════════════════════════════════════════════════
-- NØID GUARDRAIL SYSTEM - DATABASE SCHEMA
-- ════════════════════════════════════════════════════════════════
-- Migration: 0008_guardrail_system
-- Date: 2025-11-17
-- Description: Tables for guardrail violation tracking and audit logs

-- ════════════════════════════════════════════════════════════════
-- 1. GUARDRAIL VIOLATIONS TABLE
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS guardrail_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project TEXT NOT NULL CHECK (project IN ('synqra', 'noid', 'aurafx')),
  category TEXT NOT NULL CHECK (category IN ('budget', 'safety', 'privacy', 'brand', 'rate', 'isolation', 'data')),
  level TEXT NOT NULL CHECK (level IN ('soft', 'medium', 'hard', 'critical')),
  rule TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id TEXT,
  request_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('blocked', 'logged', 'alerted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for common queries
  INDEX idx_guardrail_violations_project (project),
  INDEX idx_guardrail_violations_category (category),
  INDEX idx_guardrail_violations_level (level),
  INDEX idx_guardrail_violations_created_at (created_at DESC),
  INDEX idx_guardrail_violations_user_id (user_id),
  INDEX idx_guardrail_violations_request_id (request_id)
);

-- Row Level Security
ALTER TABLE guardrail_violations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all violations
CREATE POLICY "Admins can view all violations" ON guardrail_violations
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policy: Users can see their own violations
CREATE POLICY "Users can view own violations" ON guardrail_violations
  FOR SELECT
  USING (user_id = auth.uid()::TEXT);

-- ════════════════════════════════════════════════════════════════
-- 2. GUARDRAIL AUDIT LOG TABLE
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS guardrail_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project TEXT NOT NULL CHECK (project IN ('synqra', 'noid', 'aurafx')),
  operation TEXT NOT NULL,
  request_id TEXT NOT NULL,
  user_id TEXT,
  allowed BOOLEAN NOT NULL,
  overall_level TEXT CHECK (overall_level IN ('soft', 'medium', 'hard', 'critical')),
  checks_run INTEGER NOT NULL DEFAULT 0,
  checks_passed INTEGER NOT NULL DEFAULT 0,
  checks_failed INTEGER NOT NULL DEFAULT 0,
  violations_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(10, 6),
  content_length INTEGER,
  processing_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_guardrail_audit_project (project),
  INDEX idx_guardrail_audit_allowed (allowed),
  INDEX idx_guardrail_audit_created_at (created_at DESC),
  INDEX idx_guardrail_audit_user_id (user_id),
  INDEX idx_guardrail_audit_request_id (request_id)
);

-- Row Level Security
ALTER TABLE guardrail_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all audit logs
CREATE POLICY "Admins can view all audit logs" ON guardrail_audit_log
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- ════════════════════════════════════════════════════════════════
-- 3. GUARDRAIL CONFIGURATION TABLE
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS guardrail_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project TEXT UNIQUE NOT NULL CHECK (project IN ('synqra', 'noid', 'aurafx')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  level TEXT NOT NULL CHECK (level IN ('soft', 'medium', 'hard', 'critical')) DEFAULT 'hard',
  rules JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index
  INDEX idx_guardrail_config_project (project)
);

-- Row Level Security
ALTER TABLE guardrail_config ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read configuration
CREATE POLICY "Anyone can read configuration" ON guardrail_config
  FOR SELECT
  USING (TRUE);

-- Policy: Only admins can update configuration
CREATE POLICY "Admins can update configuration" ON guardrail_config
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- ════════════════════════════════════════════════════════════════
-- 4. VIOLATION STATISTICS VIEW
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW guardrail_violation_stats AS
SELECT
  project,
  category,
  level,
  COUNT(*) as total_violations,
  COUNT(*) FILTER (WHERE action = 'blocked') as blocked_count,
  COUNT(*) FILTER (WHERE action = 'logged') as logged_count,
  COUNT(*) FILTER (WHERE action = 'alerted') as alerted_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30d,
  MIN(created_at) as first_violation,
  MAX(created_at) as latest_violation
FROM guardrail_violations
GROUP BY project, category, level;

-- ════════════════════════════════════════════════════════════════
-- 5. AUDIT LOG STATISTICS VIEW
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW guardrail_audit_stats AS
SELECT
  project,
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE allowed = TRUE) as allowed_requests,
  COUNT(*) FILTER (WHERE allowed = FALSE) as blocked_requests,
  ROUND(AVG(checks_run), 2) as avg_checks_run,
  ROUND(AVG(processing_time_ms), 2) as avg_processing_time_ms,
  SUM(estimated_cost) as total_estimated_cost,
  SUM(violations_count) as total_violations
FROM guardrail_audit_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY project, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- ════════════════════════════════════════════════════════════════
-- 6. INSERT DEFAULT CONFIGURATIONS
-- ════════════════════════════════════════════════════════════════

-- Synqra configuration
INSERT INTO guardrail_config (project, enabled, level, rules)
VALUES (
  'synqra',
  TRUE,
  'hard',
  '{
    "budget": {
      "monthlyLimit": 200,
      "dailyLimit": 7,
      "hourlyLimit": 0.5,
      "perRequestLimit": 0.05,
      "alertThresholds": {
        "warning": 70,
        "critical": 85,
        "emergency": 95
      }
    },
    "safety": {
      "hallucinationDetection": true,
      "unsafeContentBlocking": true,
      "piiProtection": true,
      "confidenceValidation": true,
      "dualPassRequired": false
    },
    "privacy": {
      "gdprCompliance": true,
      "ccpaCompliance": true,
      "dataRetentionDays": 90,
      "anonymizeLogging": true,
      "requireConsent": true
    },
    "brand": {
      "voiceConsistencyCheck": true,
      "toneValidation": true,
      "prohibitedWords": ["cheap", "basic", "generic", "template", "spam", "fake"],
      "requiredVoiceAttributes": ["premium", "executive", "polished", "professional"]
    },
    "rate": {
      "requestsPerMinute": 60,
      "requestsPerHour": 1000,
      "requestsPerDay": 10000,
      "concurrentRequests": 10,
      "burstLimit": 100
    },
    "isolation": {
      "enforceProjectBoundaries": true,
      "preventCrossProjectAccess": true,
      "isolateApiKeys": true,
      "isolateData": true,
      "cannotModifyFiles": ["**/.env*", "**/config/secrets.ts", "**/guardrails/**"]
    }
  }'::JSONB
)
ON CONFLICT (project) DO NOTHING;

-- NØID configuration
INSERT INTO guardrail_config (project, enabled, level, rules)
VALUES (
  'noid',
  TRUE,
  'hard',
  '{
    "budget": {
      "monthlyLimit": 150,
      "dailyLimit": 5,
      "hourlyLimit": 0.3,
      "perRequestLimit": 0.03,
      "alertThresholds": {
        "warning": 70,
        "critical": 85,
        "emergency": 95
      }
    },
    "safety": {
      "hallucinationDetection": true,
      "unsafeContentBlocking": true,
      "piiProtection": true,
      "confidenceValidation": true,
      "dualPassRequired": false
    },
    "privacy": {
      "gdprCompliance": true,
      "ccpaCompliance": true,
      "dataRetentionDays": 90,
      "anonymizeLogging": true,
      "requireConsent": true
    },
    "brand": {
      "voiceConsistencyCheck": true,
      "toneValidation": true,
      "prohibitedWords": ["cheap", "low-quality", "amateur"],
      "requiredVoiceAttributes": ["luxury", "premium", "exclusive"]
    },
    "rate": {
      "requestsPerMinute": 30,
      "requestsPerHour": 500,
      "requestsPerDay": 5000,
      "concurrentRequests": 5,
      "burstLimit": 50
    },
    "isolation": {
      "enforceProjectBoundaries": true,
      "preventCrossProjectAccess": true,
      "isolateApiKeys": true,
      "isolateData": true,
      "cannotModifyFiles": ["**/.env*", "**/config/secrets.ts", "**/guardrails/**"]
    }
  }'::JSONB
)
ON CONFLICT (project) DO NOTHING;

-- AuraFX configuration  
INSERT INTO guardrail_config (project, enabled, level, rules)
VALUES (
  'aurafx',
  TRUE,
  'hard',
  '{
    "budget": {
      "monthlyLimit": 100,
      "dailyLimit": 3.5,
      "hourlyLimit": 0.2,
      "perRequestLimit": 0.02,
      "alertThresholds": {
        "warning": 70,
        "critical": 85,
        "emergency": 95
      }
    },
    "safety": {
      "hallucinationDetection": true,
      "unsafeContentBlocking": true,
      "piiProtection": true,
      "confidenceValidation": true,
      "dualPassRequired": false
    },
    "privacy": {
      "gdprCompliance": true,
      "ccpaCompliance": true,
      "dataRetentionDays": 365,
      "anonymizeLogging": true,
      "requireConsent": true
    },
    "brand": {
      "voiceConsistencyCheck": true,
      "toneValidation": true,
      "prohibitedWords": ["robot", "artificial", "fake"],
      "requiredVoiceAttributes": ["authentic", "human", "natural"]
    },
    "rate": {
      "requestsPerMinute": 20,
      "requestsPerHour": 300,
      "requestsPerDay": 3000,
      "concurrentRequests": 3,
      "burstLimit": 30
    },
    "isolation": {
      "enforceProjectBoundaries": true,
      "preventCrossProjectAccess": true,
      "isolateApiKeys": true,
      "isolateData": true,
      "cannotModifyFiles": ["**/.env*", "**/config/secrets.ts", "**/guardrails/**", "**/voice-models/**"]
    }
  }'::JSONB
)
ON CONFLICT (project) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 7. HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════════════

-- Function to log violations to database
CREATE OR REPLACE FUNCTION log_guardrail_violation(
  p_project TEXT,
  p_category TEXT,
  p_level TEXT,
  p_rule TEXT,
  p_description TEXT,
  p_user_id TEXT DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL,
  p_action TEXT DEFAULT 'logged',
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO guardrail_violations (
    project, category, level, rule, description,
    user_id, request_id, action, metadata
  )
  VALUES (
    p_project, p_category, p_level, p_rule, p_description,
    p_user_id, p_request_id, p_action, p_metadata
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit entry
CREATE OR REPLACE FUNCTION log_guardrail_audit(
  p_project TEXT,
  p_operation TEXT,
  p_request_id TEXT,
  p_user_id TEXT DEFAULT NULL,
  p_allowed BOOLEAN DEFAULT TRUE,
  p_overall_level TEXT DEFAULT 'soft',
  p_checks_run INTEGER DEFAULT 0,
  p_checks_passed INTEGER DEFAULT 0,
  p_checks_failed INTEGER DEFAULT 0,
  p_violations_count INTEGER DEFAULT 0,
  p_estimated_cost DECIMAL DEFAULT NULL,
  p_content_length INTEGER DEFAULT NULL,
  p_processing_time_ms INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO guardrail_audit_log (
    project, operation, request_id, user_id, allowed, overall_level,
    checks_run, checks_passed, checks_failed, violations_count,
    estimated_cost, content_length, processing_time_ms, metadata
  )
  VALUES (
    p_project, p_operation, p_request_id, p_user_id, p_allowed, p_overall_level,
    p_checks_run, p_checks_passed, p_checks_failed, p_violations_count,
    p_estimated_cost, p_content_length, p_processing_time_ms, p_metadata
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old violations (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_guardrail_data()
RETURNS void AS $$
BEGIN
  -- Delete audit logs older than 90 days
  DELETE FROM guardrail_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete non-critical violations older than 30 days
  DELETE FROM guardrail_violations
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND level NOT IN ('critical');
  
  -- Keep critical violations for 1 year
  DELETE FROM guardrail_violations
  WHERE created_at < NOW() - INTERVAL '365 days'
    AND level = 'critical';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- 8. COMMENTS
-- ════════════════════════════════════════════════════════════════

COMMENT ON TABLE guardrail_violations IS 'Tracks all guardrail violations across projects';
COMMENT ON TABLE guardrail_audit_log IS 'Audit trail of all guardrail checks performed';
COMMENT ON TABLE guardrail_config IS 'Project-specific guardrail configurations';
COMMENT ON VIEW guardrail_violation_stats IS 'Aggregated violation statistics by project/category/level';
COMMENT ON VIEW guardrail_audit_stats IS 'Hourly audit statistics for monitoring';

-- ════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ════════════════════════════════════════════════════════════════

-- Verify tables created
SELECT 
  'guardrail_violations' as table_name,
  COUNT(*) as row_count
FROM guardrail_violations
UNION ALL
SELECT 
  'guardrail_audit_log',
  COUNT(*)
FROM guardrail_audit_log
UNION ALL
SELECT
  'guardrail_config',
  COUNT(*)
FROM guardrail_config;
