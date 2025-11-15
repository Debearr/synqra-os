/**
 * ============================================================
 * UNIFIED SUPABASE CLIENT - NØID LABS
 * ============================================================
 * Single source of truth for Supabase across all apps
 * Includes intelligence gathering hooks
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// CONFIGURATION
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ============================================================
// CLIENT INSTANCES
// ============================================================

let _anonClient: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

/**
 * Get anonymous (public) Supabase client
 * Safe for client-side use
 */
export function getSupabaseClient(): SupabaseClient {
  if (!_anonClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("⚠️  Supabase credentials not configured. Using mock client.");
      // Return a mock client that won't break the app
      return createClient("https://mock.supabase.co", "mock-key");
    }
    _anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _anonClient;
}

/**
 * Get service role Supabase client
 * Server-side only, bypasses RLS
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.warn("⚠️  Supabase service credentials not configured. Using mock client.");
      return createClient("https://mock.supabase.co", "mock-key");
    }
    _serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return _serviceClient;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY));
}

// ============================================================
// COMMON DATABASE TYPES
// ============================================================

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

export interface Profile {
  id: string;
  stripe_customer_id: string | null;
  tier: string | null;
  campaigns_used: number | null;
  campaigns_limit: number | null;
  renewal_date: string | null;
}

// ============================================================
// INTELLIGENCE GATHERING TYPES
// ============================================================

export interface IntelligenceLog {
  id?: string;
  app: "synqra" | "noid" | "aurafx" | "shared";
  operation: string; // e.g., "generate_content", "refine_copy", "ab_test"
  task_type?: string;
  model_used?: string;
  model_tier?: string;
  input_tokens?: number;
  output_tokens?: number;
  version_selected?: number; // For A/B testing - which version was chosen
  success: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface RecipeUsage {
  id?: string;
  recipe_type: string; // e.g., "email_template", "social_hook", "campaign_structure"
  recipe_name: string;
  app: string;
  use_count?: number;
  success_rate?: number;
  last_used?: string;
  created_at?: string;
}

// ============================================================
// INTELLIGENCE LOGGING FUNCTIONS
// ============================================================

/**
 * Log AI operation for intelligence gathering
 * No-throw - failures won't break the app
 */
export async function logIntelligence(log: IntelligenceLog): Promise<void> {
  if (!isSupabaseConfigured()) {
    return; // Silent fail in mock mode
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.from("intelligence_logs").insert({
      ...log,
      created_at: log.created_at || new Date().toISOString(),
    });

    if (error) {
      console.warn("⚠️  Intelligence logging failed (non-critical):", error.message);
    }
  } catch (err) {
    // Silent fail - don't break the app over logging
    console.warn("⚠️  Intelligence logging error:", err);
  }
}

/**
 * Track recipe/pattern usage
 */
export async function trackRecipeUsage(usage: RecipeUsage): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const client = getSupabaseClient();

    // Check if recipe already exists
    const { data: existing } = await client
      .from("recipe_usage")
      .select("id, use_count")
      .eq("recipe_type", usage.recipe_type)
      .eq("recipe_name", usage.recipe_name)
      .eq("app", usage.app)
      .single();

    if (existing) {
      // Update existing
      await client
        .from("recipe_usage")
        .update({
          use_count: (existing.use_count || 0) + 1,
          last_used: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Insert new
      await client.from("recipe_usage").insert({
        ...usage,
        use_count: 1,
        last_used: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("⚠️  Recipe tracking error:", err);
  }
}

/**
 * Get most successful recipes for a given type
 */
export async function getTopRecipes(
  recipeType: string,
  limit: number = 10
): Promise<RecipeUsage[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("recipe_usage")
      .select("*")
      .eq("recipe_type", recipeType)
      .order("use_count", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("⚠️  Failed to fetch top recipes:", err);
    return [];
  }
}

/**
 * Get intelligence metrics for dashboard
 */
export async function getIntelligenceMetrics(
  app: string,
  startDate?: string
): Promise<{
  totalOperations: number;
  successRate: number;
  totalTokens: number;
  topOperations: Array<{ operation: string; count: number }>;
}> {
  if (!isSupabaseConfigured()) {
    return {
      totalOperations: 0,
      successRate: 0,
      totalTokens: 0,
      topOperations: [],
    };
  }

  try {
    const client = getSupabaseClient();
    let query = client.from("intelligence_logs").select("*").eq("app", app);

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const logs = data || [];
    const totalOperations = logs.length;
    const successCount = logs.filter((log) => log.success).length;
    const successRate = totalOperations > 0 ? successCount / totalOperations : 0;
    const totalTokens = logs.reduce(
      (sum, log) => sum + (log.input_tokens || 0) + (log.output_tokens || 0),
      0
    );

    // Count operations
    const operationCounts = logs.reduce((acc, log) => {
      acc[log.operation] = (acc[log.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topOperations = Object.entries(operationCounts)
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOperations,
      successRate: Math.round(successRate * 100),
      totalTokens,
      topOperations,
    };
  } catch (err) {
    console.warn("⚠️  Failed to fetch intelligence metrics:", err);
    return {
      totalOperations: 0,
      successRate: 0,
      totalTokens: 0,
      topOperations: [],
    };
  }
}

// ============================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================

// For backward compatibility with existing code
export const supabase = getSupabaseClient();
export { getSupabaseClient as createSupabaseClient };
