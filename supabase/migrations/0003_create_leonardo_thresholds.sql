CREATE TABLE IF NOT EXISTS leonardo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  word_count INTEGER,
  threshold INTEGER,
  executed BOOLEAN,
  decision_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leonardo_thresholds (
  project_id TEXT PRIMARY KEY,
  min_word_threshold INTEGER DEFAULT 80,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
