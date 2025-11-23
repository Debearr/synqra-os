-- ============================================================
-- SYNQRA PILOT APPLICATIONS TABLE
-- ============================================================
-- Created: 2025-11-22
-- Purpose: Store Founder Pilot applications for approval-gate flow
-- Phase: 3 (Backend Integration)

-- Drop existing table if exists (for clean reinstall)
DROP TABLE IF EXISTS pilot_applications CASCADE;

-- Create pilot_applications table
CREATE TABLE pilot_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Application Data (7 fields from form)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  company_size TEXT NOT NULL CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  linkedin_profile TEXT,
  why_pilot TEXT NOT NULL,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  
  -- Metadata
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  -- Payment tracking (Phase 4)
  payment_link TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  
  -- Additional context
  source TEXT DEFAULT 'web',
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  
  -- Internal notes
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pilot_applications_email ON pilot_applications(email);
CREATE INDEX idx_pilot_applications_status ON pilot_applications(status);
CREATE INDEX idx_pilot_applications_applied_at ON pilot_applications(applied_at DESC);
CREATE INDEX idx_pilot_applications_company_size ON pilot_applications(company_size);

-- Create unique constraint on email (one application per email)
CREATE UNIQUE INDEX idx_pilot_applications_email_unique ON pilot_applications(LOWER(email));

-- Enable Row Level Security (RLS)
ALTER TABLE pilot_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for API routes)
CREATE POLICY "Service role has full access"
  ON pilot_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Anon users can only insert (submit applications)
CREATE POLICY "Anyone can submit applications"
  ON pilot_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Authenticated users can view their own applications
CREATE POLICY "Users can view own applications"
  ON pilot_applications
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_pilot_application_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on row change
CREATE TRIGGER pilot_applications_updated_at
  BEFORE UPDATE ON pilot_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_pilot_application_timestamp();

-- Create view for admin dashboard (Phase 4)
CREATE OR REPLACE VIEW pilot_applications_summary AS
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE applied_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE applied_at > NOW() - INTERVAL '7 days') as last_7d
FROM pilot_applications
GROUP BY status;

-- Grant permissions
GRANT SELECT ON pilot_applications_summary TO service_role;
GRANT SELECT ON pilot_applications_summary TO authenticated;

-- Add helpful comments
COMMENT ON TABLE pilot_applications IS 'Synqra Founder Pilot applications with approval-gate workflow';
COMMENT ON COLUMN pilot_applications.status IS 'Application status: pending (default), approved (payment link sent), rejected, paid (onboarding ready)';
COMMENT ON COLUMN pilot_applications.company_size IS 'Company employee count range';
COMMENT ON COLUMN pilot_applications.why_pilot IS 'Applicant motivation (50-1000 chars)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Pilot applications table created successfully';
  RAISE NOTICE '📊 Indexes created for email, status, and applied_at';
  RAISE NOTICE '🔒 RLS policies enabled for security';
  RAISE NOTICE '🎯 Ready for Phase 3 API integration';
END $$;
