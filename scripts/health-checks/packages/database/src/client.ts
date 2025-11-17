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

const supabaseUrl = process.env.SUPABASE_URL || "https://mock.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "mock-anon-key-for-testing-only";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️  Supabase credentials not configured. Using mock client. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
