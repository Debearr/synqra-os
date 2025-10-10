CREATE TABLE IF NOT EXISTS mcp_context (
  project_id TEXT PRIMARY KEY,
  state JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);
