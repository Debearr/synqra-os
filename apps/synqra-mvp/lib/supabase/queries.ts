import { getServerClient, getAdminClient } from "./client";
import type {
  Brand,
  Campaign,
  ContentRun,
  ContentVariant,
  AICall,
  Strategy,
  ErrorLog,
  ContentRunInsert,
  ContentVariantInsert,
  AICallInsert,
  StrategyInsert,
  ErrorLogInsert,
} from "./types";

/**
 * ============================================================
 * SUPABASE QUERIES - AI ROUTING SYSTEM
 * ============================================================
 * Production-grade database queries with error handling
 */

// ============================================================
// CONTENT RUNS
// ============================================================

export async function createContentRun(data: ContentRunInsert) {
  const supabase = getServerClient();

  const { data: run, error } = await supabase
    .from("content_runs")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create content run: ${error.message}`);
  return run as ContentRun;
}

export async function updateContentRun(id: string, updates: Partial<ContentRun>) {
  const supabase = getServerClient();

  const { data: run, error } = await supabase
    .from("content_runs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update content run: ${error.message}`);
  return run as ContentRun;
}

export async function getContentRun(id: string) {
  const supabase = getServerClient();

  const { data: run, error } = await supabase
    .from("content_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(`Failed to fetch content run: ${error.message}`);
  return run as ContentRun;
}

export async function listContentRuns(campaignId: string, limit = 50) {
  const supabase = getServerClient();

  const { data: runs, error } = await supabase
    .from("content_runs")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list content runs: ${error.message}`);
  return runs as ContentRun[];
}

// ============================================================
// CONTENT VARIANTS
// ============================================================

export async function createContentVariant(data: ContentVariantInsert) {
  const supabase = getServerClient();

  const { data: variant, error } = await supabase
    .from("content_variants")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create content variant: ${error.message}`);
  return variant as ContentVariant;
}

export async function listContentVariants(runId: string) {
  const supabase = getServerClient();

  const { data: variants, error } = await supabase
    .from("content_variants")
    .select("*")
    .eq("run_id", runId)
    .order("variant_index", { ascending: true });

  if (error) throw new Error(`Failed to list content variants: ${error.message}`);
  return variants as ContentVariant[];
}

// ============================================================
// AI CALLS (Cost & Performance Tracking)
// ============================================================

export async function logAICall(data: AICallInsert) {
  const supabase = getServerClient();

  const { data: call, error } = await supabase
    .from("ai_calls")
    .insert(data)
    .select()
    .single();

  if (error) {
    // Log but don't throw - cost logging failures shouldn't break the pipeline
    console.error(`Failed to log AI call: ${error.message}`);
    return null;
  }

  return call as AICall;
}

export async function getAICallStats(runId: string) {
  const supabase = getServerClient();

  const { data: calls, error } = await supabase
    .from("ai_calls")
    .select("*")
    .eq("run_id", runId);

  if (error) throw new Error(`Failed to fetch AI call stats: ${error.message}`);

  const stats = {
    totalCost: calls.reduce((sum, call) => sum + call.estimated_cost, 0),
    totalLatency: calls.reduce((sum, call) => sum + call.latency_ms, 0),
    totalTokens: calls.reduce(
      (sum, call) => sum + call.input_tokens + call.output_tokens,
      0
    ),
    callsByProvider: calls.reduce((acc, call) => {
      acc[call.provider] = (acc[call.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    calls: calls as AICall[],
  };

  return stats;
}

export async function getDailyCostSummary(date?: Date) {
  const supabase = getServerClient();
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

  const { data: calls, error } = await supabase
    .from("ai_calls")
    .select("provider, model, estimated_cost, status")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  if (error) throw new Error(`Failed to fetch daily cost summary: ${error.message}`);

  const summary = {
    totalCost: calls.reduce((sum, call) => sum + call.estimated_cost, 0),
    successCount: calls.filter((c) => c.status === "success").length,
    errorCount: calls.filter((c) => c.status === "error").length,
    byProvider: calls.reduce((acc, call) => {
      if (!acc[call.provider]) {
        acc[call.provider] = { cost: 0, count: 0 };
      }
      acc[call.provider].cost += call.estimated_cost;
      acc[call.provider].count += 1;
      return acc;
    }, {} as Record<string, { cost: number; count: number }>),
  };

  return summary;
}

// ============================================================
// STRATEGIES (DeepSeek Output Cache)
// ============================================================

export async function createStrategy(data: StrategyInsert) {
  const supabase = getServerClient();

  const { data: strategy, error } = await supabase
    .from("strategies")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create strategy: ${error.message}`);
  return strategy as Strategy;
}

export async function getLatestStrategy(campaignId: string) {
  const supabase = getServerClient();

  const { data: strategy, error } = await supabase
    .from("strategies")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch strategy: ${error.message}`);
  }

  return strategy as Strategy | null;
}

export async function getCachedStrategy(campaignId: string) {
  const strategy = await getLatestStrategy(campaignId);

  if (!strategy) return null;

  // Check if strategy is still valid
  if (strategy.expires_at) {
    const expiresAt = new Date(strategy.expires_at);
    if (expiresAt < new Date()) {
      return null; // Expired
    }
  }

  return strategy;
}

// ============================================================
// BRANDS
// ============================================================

export async function getBrand(id: string) {
  const supabase = getServerClient();

  const { data: brand, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(`Failed to fetch brand: ${error.message}`);
  return brand as Brand;
}

export async function getBrandBySlug(slug: string) {
  const supabase = getServerClient();

  const { data: brand, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw new Error(`Failed to fetch brand: ${error.message}`);
  return brand as Brand;
}

// ============================================================
// CAMPAIGNS
// ============================================================

export async function getCampaign(id: string) {
  const supabase = getServerClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(`Failed to fetch campaign: ${error.message}`);
  return campaign as Campaign;
}

export async function listCampaigns(brandId: string) {
  const supabase = getServerClient();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list campaigns: ${error.message}`);
  return campaigns as Campaign[];
}

// ============================================================
// ERROR LOGS
// ============================================================

export async function logError(data: ErrorLogInsert) {
  const supabase = getServerClient();

  const { data: log, error } = await supabase
    .from("error_logs")
    .insert(data)
    .select()
    .single();

  if (error) {
    // Log but don't throw - error logging failures shouldn't break the pipeline
    console.error(`Failed to log error: ${error.message}`);
    return null;
  }

  return log as ErrorLog;
}

export async function getRecentErrors(limit = 100) {
  const supabase = getServerClient();

  const { data: logs, error } = await supabase
    .from("error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch error logs: ${error.message}`);
  return logs as ErrorLog[];
}

// ============================================================
// HEALTH CHECKS
// ============================================================

export async function checkDatabaseHealth() {
  try {
    const supabase = getServerClient();
    
    // Simple query to test connection
    const { error } = await supabase
      .from("brands")
      .select("count")
      .limit(1);

    if (error) {
      return { healthy: false, error: error.message };
    }

    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
