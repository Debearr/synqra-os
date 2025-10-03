-- Supabase migration: posting_quota table
create table if not exists posting_quota (
  ig_account_id text primary key,
  posts_today int default 0,
  window_start timestamptz default now(),
  last_post_time timestamptz
);

-- Helpful index for querying recent activity
create index if not exists posting_quota_last_post_time_idx on posting_quota (last_post_time desc nulls last);

