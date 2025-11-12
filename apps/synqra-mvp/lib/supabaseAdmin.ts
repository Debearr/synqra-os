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

// Lazy initialization with placeholders for build time
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || 'placeholder-key';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { 
    persistSession: false,
    autoRefreshToken: false,
  },
  db: { 
    schema: 'public' 
  },
});

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
