-- Access-code auth model (single-use, hash-only, deterministic expiry)

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'access_code_role'
      and n.nspname = 'public'
  ) then
    create type public.access_code_role as enum ('user', 'admin');
  end if;
end $$;

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null,
  email text not null,
  role public.access_code_role not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint access_codes_code_hash_sha256_chk
    check (code_hash ~ '^[a-f0-9]{64}$'),
  constraint access_codes_email_not_blank_chk
    check (length(trim(email)) > 0),
  constraint access_codes_expiry_after_created_chk
    check (expires_at > created_at),
  constraint access_codes_used_after_created_chk
    check (used_at is null or used_at >= created_at)
);

create unique index if not exists idx_access_codes_code_hash_unique
  on public.access_codes (code_hash);

create index if not exists idx_access_codes_email
  on public.access_codes (email);

create index if not exists idx_access_codes_expires_at
  on public.access_codes (expires_at);

create or replace function public.enforce_access_code_single_use()
returns trigger
language plpgsql
as $$
begin
  if old.used_at is not null and new.used_at is distinct from old.used_at then
    raise exception 'Access code is single-use and has already been consumed';
  end if;

  if old.used_at is null and new.used_at is not null and new.used_at > now() then
    raise exception 'used_at cannot be set in the future';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_access_codes_single_use on public.access_codes;

create trigger trg_access_codes_single_use
before update on public.access_codes
for each row
execute function public.enforce_access_code_single_use();

