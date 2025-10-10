CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  cost_usd NUMERIC(10,2),
  total_spent_usd NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
