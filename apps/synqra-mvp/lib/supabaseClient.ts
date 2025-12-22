import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase/env";

/**
 * ============================================================
 * SUPABASE CLIENT
 * ============================================================
 * Zero-cost backend for content flywheel storage
 *
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL (must be valid HTTPS URL)
 * - SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 */

let supabase: SupabaseClient | null = null;
let supabaseInitError: Error | null = null;

try {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  supabaseInitError = error instanceof Error ? error : new Error("Unknown Supabase init error");
  supabase = null;
}

export { supabase };

/**
 * Helper to get a valid Supabase client or throw
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "❌ Supabase client not available. " +
      "Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in Railway Variables and restart." +
      (supabaseInitError ? ` Details: ${supabaseInitError.message}` : "")
    );
  }
  return supabase;
}

/**
 * Database type definitions for type safety
 */
export interface ContentJob {
  id: string;
  brief: string;
  platform: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ContentVariant {
  id: string;
  job_id: string;
  hook: string;
  caption: string;
  cta: string;
  platform: string;
  variant_index: number;
  created_at: string;
}

export interface RetentionNote {
  id: string;
  platform: string;
  video_id: string;
  avg_view_duration: number | null;
  avg_completion: number | null;
  notes: string | null;
  created_at: string;
}
