import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./supabase/env";

/**
 * Server-side only Supabase client with service role credentials.
 */

let cachedClient: SupabaseClient | null = null;
let cachedSignature: string | null = null;

function buildSignature(url: string, key: string): string {
  return `${url}::${key.slice(0, 24)}`;
}

function buildClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseServiceRoleKey();
  const signature = buildSignature(supabaseUrl, supabaseKey);

  if (cachedClient && cachedSignature === signature) {
    return cachedClient;
  }

  cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
  });
  cachedSignature = signature;
  return cachedClient;
}

export function requireSupabaseAdmin(): SupabaseClient {
  try {
    return buildClient();
  } catch (error) {
    throw new Error(
      "Supabase admin client not available. Ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE are set (SUPABASE_URL/SUPABASE_ANON_KEY are fallback aliases)." +
        ` Details: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  metadata: Record<string, any>;
}
