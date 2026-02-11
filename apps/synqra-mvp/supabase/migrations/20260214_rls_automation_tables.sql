-- RLS + update triggers + operational indexes for automation tables

create or replace function public.set_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_outcome_events_updated_at on public.outcome_events;
create trigger trg_outcome_events_updated_at
before update on public.outcome_events
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_outcome_audit_summary_updated_at on public.outcome_audit_summary;
create trigger trg_outcome_audit_summary_updated_at
before update on public.outcome_audit_summary
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_scheduling_requests_updated_at on public.scheduling_requests;
create trigger trg_scheduling_requests_updated_at
before update on public.scheduling_requests
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_background_job_runs_updated_at on public.background_job_runs;
create trigger trg_background_job_runs_updated_at
before update on public.background_job_runs
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_communications_queue_updated_at on public.communications_queue;
create trigger trg_communications_queue_updated_at
before update on public.communications_queue
for each row
execute function public.set_updated_at_column();

drop trigger if exists trg_google_oauth_tokens_updated_at on public.google_oauth_tokens;
create trigger trg_google_oauth_tokens_updated_at
before update on public.google_oauth_tokens
for each row
execute function public.set_updated_at_column();

alter table public.outcome_events enable row level security;
alter table public.outcome_audit_summary enable row level security;
alter table public.scheduling_requests enable row level security;
alter table public.background_job_runs enable row level security;
alter table public.communications_queue enable row level security;
alter table public.google_oauth_tokens enable row level security;

drop policy if exists outcome_events_user_read on public.outcome_events;
create policy outcome_events_user_read
on public.outcome_events
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists outcome_events_service_all on public.outcome_events;
create policy outcome_events_service_all
on public.outcome_events
for all
to service_role
using (true)
with check (true);

drop policy if exists outcome_audit_summary_user_read on public.outcome_audit_summary;
create policy outcome_audit_summary_user_read
on public.outcome_audit_summary
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists outcome_audit_summary_service_all on public.outcome_audit_summary;
create policy outcome_audit_summary_service_all
on public.outcome_audit_summary
for all
to service_role
using (true)
with check (true);

drop policy if exists scheduling_requests_user_read on public.scheduling_requests;
create policy scheduling_requests_user_read
on public.scheduling_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists scheduling_requests_service_all on public.scheduling_requests;
create policy scheduling_requests_service_all
on public.scheduling_requests
for all
to service_role
using (true)
with check (true);

drop policy if exists background_job_runs_user_read on public.background_job_runs;
create policy background_job_runs_user_read
on public.background_job_runs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists background_job_runs_service_all on public.background_job_runs;
create policy background_job_runs_service_all
on public.background_job_runs
for all
to service_role
using (true)
with check (true);

drop policy if exists communications_queue_user_read on public.communications_queue;
create policy communications_queue_user_read
on public.communications_queue
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists communications_queue_service_all on public.communications_queue;
create policy communications_queue_service_all
on public.communications_queue
for all
to service_role
using (true)
with check (true);

drop policy if exists google_oauth_tokens_user_read on public.google_oauth_tokens;
create policy google_oauth_tokens_user_read
on public.google_oauth_tokens
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists google_oauth_tokens_service_all on public.google_oauth_tokens;
create policy google_oauth_tokens_service_all
on public.google_oauth_tokens
for all
to service_role
using (true)
with check (true);

create index if not exists idx_outcome_events_status_platform on public.outcome_events(status, platform);
create index if not exists idx_scheduling_requests_status_time on public.scheduling_requests(approval_status, scheduled_time);
create index if not exists idx_background_job_runs_status_time on public.background_job_runs(status, scheduled_time);
create index if not exists idx_communications_queue_status on public.communications_queue(approval_status, sensitivity_level);
