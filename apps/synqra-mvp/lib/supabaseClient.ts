import { createClient } from "@supabase/supabase-js";

/**
 * ============================================================
 * SUPABASE CLIENT
 * ============================================================
 * Zero-cost backend for content flywheel storage
 *
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 */

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
