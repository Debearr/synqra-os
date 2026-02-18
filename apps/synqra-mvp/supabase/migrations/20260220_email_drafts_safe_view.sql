-- DB-level suppression enforcement for outbound sending

create or replace view ops_realtors.email_drafts_safe as
select d.*
from ops_realtors.email_drafts d
left join ops_audit.suppression_list s
  on lower(s.email) = lower(d.to_email)
where s.email is null;

create or replace view ops_travel.email_drafts_safe as
select d.*
from ops_travel.email_drafts d
left join ops_audit.suppression_list s
  on lower(s.email) = lower(d.to_email)
where s.email is null;

comment on view ops_realtors.email_drafts_safe is 'Send-safe drafts only (suppressed recipients excluded).';
comment on view ops_travel.email_drafts_safe is 'Send-safe drafts only (suppressed recipients excluded).';

