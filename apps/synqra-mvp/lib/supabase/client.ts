import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * ============================================================
 * SUPABASE CLIENT - AI ROUTING SYSTEM
 * ============================================================
 * Provides server-safe and client-safe Supabase clients
 */

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local"
  );
}

/**
 * Client-side Supabase client (uses anon key)
 * Safe to use in browser contexts
 */
export const getClientClient = () => {
  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

/**
 * Server-side Supabase client (uses anon key)
 * For use in API routes and server components
 */
export const getServerClient = () => {
  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Admin Supabase client (uses service role key)
 * Bypasses RLS - use with caution
 * Only for trusted server-side operations
 */
export const getAdminClient = () => {
  if (!supabaseServiceRole) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE environment variable");
  }

  return createClient<Database>(supabaseUrl!, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Legacy export for backward compatibility
 */
export const supabase = getClientClient();
