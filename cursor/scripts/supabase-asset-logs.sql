create table if not exists asset_logs (
  id bigserial primary key,
  file_name text,
  file_type text,
  size_kb numeric,
  checksum text,
  created_at timestamp,
  validation_status text,
  version_tag text
);
