CREATE TABLE IF NOT EXISTS leonardo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  word_count INTEGER,
  threshold INTEGER,
  executed BOOLEAN,
  decision_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
