CREATE TABLE tenant_quota (
  tenant_id uuid PRIMARY KEY,
  tier text,
  posts_today int DEFAULT 0,
  dalle_batches_today int DEFAULT 0
);
