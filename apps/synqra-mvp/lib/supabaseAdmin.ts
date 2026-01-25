import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './supabase/env';

/**
 * ============================================================
 * SUPABASE ADMIN CLIENT (Service Role)
 * ============================================================
 * Server-side only client with elevated permissions
 * 
 * ⚠️  SECURITY: Never expose this in client-side code
 * 
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL (must be valid HTTPS URL)
 * - SUPABASE_SERVICE_ROLE: Your Supabase service role key (secret!)
 */

let supabaseAdmin: SupabaseClient | null = null;
let supabaseAdminInitError: Error | null = null;

try {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseServiceRoleKey();

  supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
} catch (error) {
  supabaseAdminInitError = error instanceof Error ? error : new Error("Unknown Supabase admin init error");
  supabaseAdmin = null;
}

export { supabaseAdmin };

// Helper to ensure client is available
export function requireSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error(
      "❌ Supabase Admin client not available. " +
      "Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Railway Variables and restart." +
      (supabaseAdminInitError ? ` Details: ${supabaseAdminInitError.message}` : "")
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
