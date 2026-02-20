-- FILE 2: 20260222_rls_health_cell_tables.sql
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'services','health_checks','metrics','incidents',
    'incident_updates','maintenance_windows','alert_rules',
    'alert_history','sla_targets','status_page_subscriptions',
    'audit_logs'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "service_role_full_access" ON public.%I
      FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "authenticated_read_only" ON public.%I
      FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END;
$$;
