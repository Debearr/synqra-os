import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support multiple naming conventions for backwards compatibility
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

/**
 * Validate that a URL is a valid HTTP/HTTPS URL.
 * Prevents build-time errors when env vars are missing or invalid.
 */
function isValidSupabaseUrl(url: string | undefined): url is string {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Only create client if we have valid credentials
// This prevents build-time errors when env vars are not configured
const hasValidCredentials = isValidSupabaseUrl(supabaseUrl) && !!supabaseKey;

// Export a typed client or null if credentials not configured
export const supabaseAdmin: SupabaseClient | null = hasValidCredentials
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
export function requireSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error(
      '❌ Supabase Admin client not available. ' +
      'Ensure SUPABASE_URL (valid HTTPS URL) and SUPABASE_SERVICE_KEY are set in environment.'
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
