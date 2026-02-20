-- FILE 1: 20260222_users_role_subscription_columns.sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'visitor';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'none';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pilot_approved_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pilot_expires_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pilot_score integer;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pilot_summary text;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON public.users
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "users_read_own_row" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "users_update_own_row" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
