-- New: mid-process validation log
CREATE TABLE IF NOT EXISTS validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  template_id UUID NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('discover','define','develop','deliver')),
  passed BOOLEAN NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- New: AI council audit trail
CREATE TABLE IF NOT EXISTS ai_council_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  asset_id UUID,
  claude_summary TEXT,
  gemini_summary TEXT,
  grok_summary TEXT,
  overall BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing and SDK tables
CREATE TABLE IF NOT EXISTS pricing_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  complexity_weight NUMERIC NOT NULL,
  time_estimate_hours NUMERIC NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  integration_fees NUMERIC DEFAULT 0,
  strategic_impact_score NUMERIC DEFAULT 1.0, -- 1.0 to 2.0
  computed_total NUMERIC GENERATED ALWAYS AS
    (((complexity_weight * time_estimate_hours * hourly_rate) + integration_fees) * strategic_impact_score) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sdk_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT,
  contact_email TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('freemium','pro','enterprise')),
  api_key TEXT UNIQUE NOT NULL,
  rate_limit_per_min INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple policy examples (adapt to your RLS posture)
ALTER TABLE validation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_council_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_clients ENABLE ROW LEVEL SECURITY;

-- (Add your existing authenticated / service_role policies as needed)
CREATE TABLE IF NOT EXISTS acceptable_use_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT,
  effective_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_aup_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  aup_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);
