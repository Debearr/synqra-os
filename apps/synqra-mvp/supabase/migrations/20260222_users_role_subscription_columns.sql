-- Block 3 foundation: canonical role and subscription columns.
-- Adds requested fields to public.users when the table exists.

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS role text DEFAULT 'visitor',
      ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS stripe_customer_id text,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
      ADD COLUMN IF NOT EXISTS pilot_approved_at timestamptz,
      ADD COLUMN IF NOT EXISTS pilot_expires_at timestamptz,
      ADD COLUMN IF NOT EXISTS pilot_score integer,
      ADD COLUMN IF NOT EXISTS pilot_summary text;
  ELSE
    RAISE NOTICE 'public.users not found; skipped Block 3 role/subscription column additions.';
  END IF;
END
$$;
