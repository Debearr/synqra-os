-- Indexes for performance on common lookups
create index if not exists idx_posting_queue_user_id on posting_queue(user_id);
create index if not exists idx_posting_queue_status on posting_queue(status);
create index if not exists idx_posting_queue_platform on posting_queue(platform);
create index if not exists idx_posting_queue_created_at on posting_queue(created_at);

create index if not exists idx_bvas_logs_posting_id on bvas_logs(posting_id);

create index if not exists idx_policy_violations_user_id on policy_violations(user_id);
