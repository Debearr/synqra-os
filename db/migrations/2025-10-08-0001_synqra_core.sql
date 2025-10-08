-- === SYNQRA v3.1 Core Additions ===

-- Stores inbound meeting requests/intents parsed from transcripts
CREATE TABLE IF NOT EXISTS content_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript text NOT NULL,
  platform text,
  audience text,
  variables jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_intents_status_idx ON content_intents(status);

-- Dead-letter queue for any failed external calls or assembly steps
CREATE TABLE IF NOT EXISTS error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid REFERENCES content_intents(id) ON DELETE SET NULL,
  step text NOT NULL,                -- e.g., 'AuraFX', 'Leonardo', 'CreateDraft'
  payload jsonb,                     -- request/response snapshot
  reason text,
  retryable boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS error_log_step_idx ON error_log(step);

-- Circuit breaker state for external services
CREATE TABLE IF NOT EXISTS service_health (
  service text PRIMARY KEY,          -- 'aurafx','leonardo'
  failure_count int DEFAULT 0,
  is_disabled boolean DEFAULT false,
  last_failure timestamptz
);

-- Idempotency registry to avoid duplicate drafts on retry
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,              -- e.g., md5(transcript || platform || audience || scheduled_day)
  created_at timestamptz DEFAULT now()
);

-- Helper function: record a failure and potentially flip circuit breaker after threshold
CREATE OR REPLACE FUNCTION record_service_failure(svc text, max_failures int DEFAULT 5)
RETURNS void AS $$
BEGIN
  INSERT INTO service_health(service, failure_count, is_disabled, last_failure)
  VALUES (svc, 1, false, now())
  ON CONFLICT (service) DO UPDATE
  SET failure_count = service_health.failure_count + 1,
      last_failure = now(),
      is_disabled = (service_health.failure_count + 1) >= max_failures;
END;
$$ LANGUAGE plpgsql;

-- Helper function: reset service after a successful call
CREATE OR REPLACE FUNCTION record_service_success(svc text)
RETURNS void AS $$
BEGIN
  INSERT INTO service_health(service, failure_count, is_disabled, last_failure)
  VALUES (svc, 0, false, NULL)
  ON CONFLICT (service) DO UPDATE
  SET failure_count = 0, is_disabled = false, last_failure = NULL;
END;
$$ LANGUAGE plpgsql;

-- RLS toggles (enable after testing)
ALTER TABLE content_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health  ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Simple service role blanket (adjust per env)
CREATE POLICY service_role_all ON content_intents FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY service_role_all ON error_log       FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY service_role_all ON service_health  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY service_role_all ON idempotency_keys FOR ALL USING (auth.jwt()->>'role' = 'service_role');

