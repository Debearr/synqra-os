CREATE TABLE IF NOT EXISTS public.status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  service TEXT NOT NULL,
  status_code INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status_logs_timestamp ON public.status_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_status_logs_service ON public.status_logs (service);
