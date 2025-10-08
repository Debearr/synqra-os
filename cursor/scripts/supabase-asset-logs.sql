create table if not exists asset_logs (
  id bigserial primary key,
  file_name text,
  file_type text,
  size_kb numeric,
  checksum text,
  created_at timestamp,
  validation_status text,
  version_tag text,
  dominant_color text,
  last_scan timestamp
);

alter table if exists asset_logs
  add column if not exists dominant_color text,
  add column if not exists last_scan timestamp;
