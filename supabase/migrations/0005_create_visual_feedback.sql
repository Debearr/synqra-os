CREATE TABLE IF NOT EXISTS visual_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  asset_id TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
