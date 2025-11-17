-- ============================================================
-- SYNQRA WAITLIST TABLE SETUP
-- ============================================================
-- Run this in your Supabase SQL Editor
--
-- Features:
-- - Duplicate email prevention (UNIQUE constraint)
-- - Performance indexes
-- - RLS enabled (service role bypasses RLS)
-- - Metadata field for future tracking (UTM, referrer, etc.)

-- 1) Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,  -- ← UNIQUE constraint prevents duplicates
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb  -- For tracking source, UTM params, etc.
);

-- 2) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist(created_at DESC);

-- 3) Enable Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 4) No anon policies needed (service role bypasses RLS)
-- The API route uses SUPABASE_SERVICE_ROLE which bypasses RLS
-- This keeps the waitlist data secure and only accessible via the API

-- ============================================================
-- OPTIONAL: View waitlist entries (for admin dashboard)
-- ============================================================

-- Example query to see all waitlist entries:
-- SELECT id, email, full_name, created_at 
-- FROM public.waitlist 
-- ORDER BY created_at DESC;

-- Example query to get waitlist count:
-- SELECT COUNT(*) FROM public.waitlist;

-- Example query to check if email exists:
-- SELECT EXISTS(SELECT 1 FROM public.waitlist WHERE email = 'test@example.com');
