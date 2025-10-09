CREATE TABLE IF NOT EXISTS public.dns_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  domain TEXT,
  status TEXT,
  details TEXT,
  dns_output TEXT
);
