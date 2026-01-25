-- ============================================================
-- COUNCIL LOGGING TABLES
-- ============================================================
-- Tables for tracking queryCouncil operations and decisions
-- Additive logging only (no changes to existing tables)
-- ============================================================

CREATE TABLE IF NOT EXISTS council_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('synqra', 'noid', 'aurafx', 'shared')),
  prompt TEXT NOT NULL,
  system_prompt TEXT,
  requester TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS council_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id UUID NOT NULL REFERENCES council_queries(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_role TEXT,
  task_type TEXT,
  model_used TEXT,
  model_tier TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS council_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id UUID NOT NULL REFERENCES council_queries(id) ON DELETE CASCADE,
  selection_method TEXT NOT NULL,
  selected_response_id UUID REFERENCES council_responses(id) ON DELETE SET NULL,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_council_queries_app ON council_queries(app);
CREATE INDEX IF NOT EXISTS idx_council_queries_created_at ON council_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_council_responses_query_id ON council_responses(query_id);
CREATE INDEX IF NOT EXISTS idx_council_responses_member ON council_responses(member_name);
CREATE INDEX IF NOT EXISTS idx_council_decisions_query_id ON council_decisions(query_id);

ALTER TABLE council_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to council_queries"
  ON council_queries FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access to council_responses"
  ON council_responses FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access to council_decisions"
  ON council_decisions FOR ALL
  TO service_role
  USING (true);

COMMENT ON TABLE council_queries IS 'Tracks council queries for auditability and analysis';
COMMENT ON TABLE council_responses IS 'Stores per-member responses for council queries';
COMMENT ON TABLE council_decisions IS 'Stores council decisions and selection metadata';
