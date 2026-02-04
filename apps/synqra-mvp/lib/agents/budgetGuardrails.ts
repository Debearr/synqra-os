/**
 * ============================================================
 * BUDGET GUARDRAILS - HARD COST PROTECTION
 * ============================================================
 * Ensures costs NEVER exceed $200/month
 * Automatic safety mechanisms to prevent runaway costs
 */

import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

export interface BudgetConfig {
  monthlyBudget: number; // Maximum budget in dollars
  dailyBudget: number; // Maximum per day
  hourlyBudget: number; // Maximum per hour
  perRequestMax: number; // Maximum cost per single request
  alertThresholds: {
    warning: number; // % of budget to trigger warning (e.g., 70%)
    critical: number; // % of budget to trigger critical alert (e.g., 85%)
    emergency: number; // % of budget to stop all requests (e.g., 95%)
  };
}

// HARD BUDGET LIMITS - DO NOT EXCEED
const DEFAULT_BUDGET: BudgetConfig = {
  monthlyBudget: 200, // $200/month hard limit
  dailyBudget: 7, // $7/day (~$210/month with buffer)
  hourlyBudget: 0.5, // $0.50/hour (12 hours = $6/day)
  perRequestMax: 0.05, // $0.05 per request (prevents single expensive query)
  alertThresholds: {
    warning: 70, // Alert at 70% ($140)
    critical: 85, // Critical at 85% ($170)
    emergency: 95, // STOP at 95% ($190)
  },
};

let lastAlertSent: { [key: string]: number } = {}; // Prevent alert spam

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

async function getBudgetUsageRecord(): Promise<{
  id?: string;
  used: number;
  limit: number;
  period_start: string;
  period_end: string;
  last_updated: string;
}> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("budget_usage")
    .select("id, used, limit, period_start, period_end, last_updated")
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load budget usage: ${error.message}`);
  }

  if (!data) {
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    return {
      used: 0,
      limit: DEFAULT_BUDGET.monthlyBudget,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      last_updated: new Date().toISOString(),
    };
  }

  return data;
}

async function sumCostSince(cutoffIso: string): Promise<number> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("budget_tracking")
    .select("cost_usd")
    .gte("timestamp", cutoffIso);

  if (error) {
    throw new Error(`Failed to load budget tracking: ${error.message}`);
  }

  return (data || []).reduce((sum, row) => sum + (row.cost_usd || 0), 0);
}

async function getThrottlingState(): Promise<
  { state: string; percentage: number } | { state: "NORMAL"; percentage: number }
> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.rpc("get_current_throttling_state");

  if (error || !data || data.length === 0) {
    return { state: "NORMAL", percentage: 0 };
  }

  return {
    state: data[0].state,
    percentage: Number(data[0].percentage || 0),
  };
}

/**
 * Check if request is allowed based on budget
 * Returns: { allowed, reason, currentCost, remainingBudget }
 */
export async function checkBudget(estimatedCost: number): Promise<{
  allowed: boolean;
  reason: string;
  currentCost: number;
  remainingBudget: number;
  alertLevel: "none" | "warning" | "critical" | "emergency";
}> {
  const now = new Date();
  const usage = await getBudgetUsageRecord();
  const monthlyCost = usage.used || 0;

  const dailyCutoff = new Date(now);
  dailyCutoff.setDate(dailyCutoff.getDate() - 1);
  const hourlyCutoff = new Date(now.getTime() - 60 * 60 * 1000);

  const [dailyCost, hourlyCost] = await Promise.all([
    sumCostSince(dailyCutoff.toISOString()),
    sumCostSince(hourlyCutoff.toISOString()),
  ]);

  // Check per-request limit
  if (estimatedCost > DEFAULT_BUDGET.perRequestMax) {
    return {
      allowed: false,
      reason: `Request exceeds per-request limit of $${DEFAULT_BUDGET.perRequestMax}`,
      currentCost: monthlyCost,
      remainingBudget: DEFAULT_BUDGET.monthlyBudget - monthlyCost,
      alertLevel: "critical",
    };
  }

  // Check monthly limit
  const monthlyPercentage =
    ((monthlyCost + estimatedCost) / DEFAULT_BUDGET.monthlyBudget) * 100;
  if (monthlyCost + estimatedCost >= DEFAULT_BUDGET.monthlyBudget) {
    sendAlert("emergency", monthlyCost, DEFAULT_BUDGET.monthlyBudget);
    return {
      allowed: false,
      reason: "Monthly budget exceeded. All requests blocked.",
      currentCost: monthlyCost,
      remainingBudget: 0,
      alertLevel: "emergency",
    };
  }

  // Check daily limit
  if (dailyCost + estimatedCost >= DEFAULT_BUDGET.dailyBudget) {
    return {
      allowed: false,
      reason: "Daily budget exceeded. Try again tomorrow.",
      currentCost: monthlyCost,
      remainingBudget: DEFAULT_BUDGET.monthlyBudget - monthlyCost,
      alertLevel: "critical",
    };
  }

  // Check hourly limit
  if (hourlyCost + estimatedCost >= DEFAULT_BUDGET.hourlyBudget) {
    return {
      allowed: false,
      reason: "Hourly budget exceeded. Try again in an hour.",
      currentCost: monthlyCost,
      remainingBudget: DEFAULT_BUDGET.monthlyBudget - monthlyCost,
      alertLevel: "warning",
    };
  }

  // Determine alert level
  let alertLevel: "none" | "warning" | "critical" | "emergency" = "none";
  if (monthlyPercentage >= DEFAULT_BUDGET.alertThresholds.emergency) {
    alertLevel = "emergency";
    sendAlert("emergency", monthlyCost, DEFAULT_BUDGET.monthlyBudget);
  } else if (monthlyPercentage >= DEFAULT_BUDGET.alertThresholds.critical) {
    alertLevel = "critical";
    sendAlert("critical", monthlyCost, DEFAULT_BUDGET.monthlyBudget);
  } else if (monthlyPercentage >= DEFAULT_BUDGET.alertThresholds.warning) {
    alertLevel = "warning";
    sendAlert("warning", monthlyCost, DEFAULT_BUDGET.monthlyBudget);
  }

  return {
    allowed: true,
    reason: "Within budget",
    currentCost: monthlyCost,
    remainingBudget: DEFAULT_BUDGET.monthlyBudget - monthlyCost,
    alertLevel,
  };
}

/**
 * Record actual cost after request completes
 */
export async function recordCost(actualCost: number): Promise<void> {
  const supabase = requireSupabaseAdmin();
  await supabase.rpc("increment_budget_usage", { p_cost: actualCost });

  const throttling = await getThrottlingState();
  const usage = await getBudgetUsageRecord();
  const usagePercentage = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;

  const { error } = await supabase.from("budget_tracking").insert({
    timestamp: new Date().toISOString(),
    usage_percentage: usagePercentage,
    throttling_state: throttling.state,
    requests_allowed: 1,
    requests_throttled: 0,
    cache_hits: 0,
    cache_misses: 0,
    cost_usd: actualCost,
  });

  if (error) {
    console.error("Failed to record budget tracking snapshot:", error);
  }

  if (process.env.DEBUG_AGENTS === "true") {
    console.log(`?? Cost recorded: $${actualCost.toFixed(4)}`);
    console.log(`   Monthly: $${usage.used.toFixed(2)} / $${DEFAULT_BUDGET.monthlyBudget}`);
  }
}

/**
 * Send alert to admin (Telegram, email, etc.)
 */
function sendAlert(
  level: "warning" | "critical" | "emergency",
  currentCost: number,
  budgetLimit: number
): void {
  const alertKey = `${level}-${getCurrentMonth()}`;
  const now = Date.now();

  // Prevent alert spam (max 1 per hour per level)
  if (lastAlertSent[alertKey] && now - lastAlertSent[alertKey] < 3600000) {
    return;
  }

  lastAlertSent[alertKey] = now;

  const percentage = (currentCost / budgetLimit) * 100;
  const message = `
?? BUDGET ALERT: ${level.toUpperCase()}

Current: $${currentCost.toFixed(2)} (${percentage.toFixed(1)}%)
Budget: $${budgetLimit}
Remaining: $${(budgetLimit - currentCost).toFixed(2)}

${level === "emergency" ? "?? ALL REQUESTS BLOCKED" : ""}
${level === "critical" ? "?? APPROACHING LIMIT" : ""}
${level === "warning" ? "?? Monitor closely" : ""}

Time: ${new Date().toISOString()}
`.trim();

  // Log to console
  console.error(message);

  // Send to Telegram (if configured)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "HTML",
      }),
    }).catch((err) => console.error("Failed to send Telegram alert:", err));
  }
}

/**
 * Get current budget status
 */
export async function getBudgetStatus(): Promise<{
  monthly: { used: number; limit: number; percentage: number };
  daily: { used: number; limit: number; percentage: number };
  hourly: { used: number; limit: number; percentage: number };
  projectedMonthlyTotal: number;
}> {
  const usage = await getBudgetUsageRecord();
  const now = new Date();

  const dailyCutoff = new Date(now);
  dailyCutoff.setDate(dailyCutoff.getDate() - 1);
  const hourlyCutoff = new Date(now.getTime() - 60 * 60 * 1000);

  const [dailyCost, hourlyCost] = await Promise.all([
    sumCostSince(dailyCutoff.toISOString()),
    sumCostSince(hourlyCutoff.toISOString()),
  ]);

  const monthlyCost = usage.used || 0;
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const avgDailyCost = dayOfMonth > 0 ? monthlyCost / dayOfMonth : 0;
  const projectedMonthlyTotal = avgDailyCost * daysInMonth;

  return {
    monthly: {
      used: monthlyCost,
      limit: DEFAULT_BUDGET.monthlyBudget,
      percentage: (monthlyCost / DEFAULT_BUDGET.monthlyBudget) * 100,
    },
    daily: {
      used: dailyCost,
      limit: DEFAULT_BUDGET.dailyBudget,
      percentage: (dailyCost / DEFAULT_BUDGET.dailyBudget) * 100,
    },
    hourly: {
      used: hourlyCost,
      limit: DEFAULT_BUDGET.hourlyBudget,
      percentage: (hourlyCost / DEFAULT_BUDGET.hourlyBudget) * 100,
    },
    projectedMonthlyTotal,
  };
}

/**
 * Admin override to unlock budget (use carefully!)
 */
export async function unlockBudget(adminKey: string): Promise<boolean> {
  if (adminKey !== process.env.ADMIN_OVERRIDE_KEY) {
    return false;
  }

  const supabase = requireSupabaseAdmin();
  const usage = await getBudgetUsageRecord();
  if (!usage.id) {
    return true;
  }

  const { error } = await supabase
    .from("budget_usage")
    .update({ used: 0, last_updated: new Date().toISOString() })
    .eq("id", usage.id);

  if (error) {
    console.error("Failed to unlock budget:", error);
    return false;
  }

  console.warn("?? Budget manually unlocked by admin");
  return true;
}

/**
 * Reset cost tracking (for testing only)
 */
export async function resetTracking(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    const supabase = requireSupabaseAdmin();
    await supabase.from("budget_tracking").delete().neq("id", "");
    const usage = await getBudgetUsageRecord();
    if (usage.id) {
      await supabase
        .from("budget_usage")
        .update({ used: 0, last_updated: new Date().toISOString() })
        .eq("id", usage.id);
    }
    console.log("? Cost tracking reset");
  }
}

/**
 * Estimate cost for a request before making it
 */
export function estimateRequestCost(
  inputTokens: number,
  outputTokens: number,
  model: string = "claude-3-5-sonnet-20241022"
): number {
  // Claude 3.5 Sonnet pricing
  const inputCostPer1M = 3; // $3 per 1M input tokens
  const outputCostPer1M = 15; // $15 per 1M output tokens

  const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;

  return inputCost + outputCost;
}
