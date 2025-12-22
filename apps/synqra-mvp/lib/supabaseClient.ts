import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
const hasValidCredentials = isValidSupabaseUrl(supabaseUrl) && !!supabaseAnonKey;

// Export a typed client or null if credentials not configured
export const supabase: SupabaseClient | null = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Helper to get a valid Supabase client or throw
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      '❌ Supabase client not available. ' +
      'Ensure SUPABASE_URL (valid HTTPS URL) and SUPABASE_ANON_KEY are set in environment.'
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
