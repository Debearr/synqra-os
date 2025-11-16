import { createClient } from '@supabase/supabase-js';

/**
 * ============================================================
 * SUPABASE ADMIN CLIENT (Service Role)
 * ============================================================
 * Server-side only client with elevated permissions
 * 
 * ⚠️  SECURITY: Never expose this in client-side code
 * 
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE: Your Supabase service role key (secret!)
 */

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support multiple naming conventions for backwards compatibility
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

// CRITICAL FIX: Don't throw at module level - this crashes the entire app on Railway!
// Instead, create a safe client that will fail gracefully on actual use
if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment. ' +
    'Admin client will not function. Set these in Railway environment variables.'
  );
  console.error('Current env check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlPrefix: supabaseUrl?.substring(0, 20),
  });
}

// Create client with fallback to prevent module-level crash
// If credentials are missing, operations will fail gracefully with proper error messages
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key-replace-with-real-service-role-key',
  {
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
    },
    db: { 
      schema: 'public' 
    },
  }
);

// Helper to check if admin client is properly configured
export const isSupabaseAdminConfigured = () => {
  return !!(
    supabaseUrl && 
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseKey && 
    supabaseKey !== 'placeholder-key-replace-with-real-service-role-key'
  );
};

/**
 * Type definitions for waitlist
 */
export interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  metadata: Record<string, any>;
}
