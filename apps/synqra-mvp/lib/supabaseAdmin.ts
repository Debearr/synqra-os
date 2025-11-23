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

// Export a typed client or null if credentials not configured
export const supabaseAdmin = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { 
        persistSession: false,
        autoRefreshToken: false,
      },
      db: { 
        schema: 'public' 
      },
    })
  : null;

// Helper to ensure client is available
export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      '❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment. ' +
      'Set these in .env.local for development or Railway for production.'
    );
  }
  return supabaseAdmin;
}

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
