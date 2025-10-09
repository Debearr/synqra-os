SELECT
  timestamp,
  status,
  retries,
  LEFT(details, 80) AS header_preview
FROM public.dns_logs
ORDER BY timestamp DESC
LIMIT 20;
