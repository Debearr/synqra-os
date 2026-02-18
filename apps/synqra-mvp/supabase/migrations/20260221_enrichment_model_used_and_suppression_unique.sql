-- Model attribution + suppression idempotency support

alter table if exists ops_realtors.enrichment
  add column if not exists model_used text not null default 'ollama';

alter table if exists ops_travel.enrichment
  add column if not exists model_used text not null default 'ollama';

create unique index if not exists idx_ops_audit_suppression_email_unique
  on ops_audit.suppression_list (email);

