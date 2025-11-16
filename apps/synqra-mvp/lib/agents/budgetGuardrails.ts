/**
 * ============================================================
 * BUDGET GUARDRAILS - HARD COST PROTECTION
 * ============================================================
 * Ensures costs NEVER exceed $200/month
 * Automatic safety mechanisms to prevent runaway costs
 */

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

// Cost tracking by time period
interface CostTracking {
  hourly: { timestamp: number; cost: number }[];
  daily: { date: string; cost: number }[];
  monthly: { month: string; cost: number };
}

let costTracking: CostTracking = {
  hourly: [],
  daily: [],
  monthly: { month: getCurrentMonth(), cost: 0 },
};

let isBudgetLocked = false; // Emergency stop flag
let lastAlertSent: { [key: string]: number } = {}; // Prevent alert spam

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get current date string (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Check if request is allowed based on budget
 * Returns: { allowed, reason, currentCost, remainingBudget }
 */
export function checkBudget(estimatedCost: number): {
  allowed: boolean;
  reason: string;
  currentCost: number;
  remainingBudget: number;
  alertLevel: "none" | "warning" | "critical" | "emergency";
} {
  // Emergency stop - budget locked
  if (isBudgetLocked) {
    return {
      allowed: false,
      reason: "Budget locked due to emergency threshold reached. Contact admin.",
      currentCost: costTracking.monthly.cost,
      remainingBudget: 0,
      alertLevel: "emergency",
    };
  }

  const now = Date.now();
  const currentMonth = getCurrentMonth();
  const currentDate = getCurrentDate();

  // Reset monthly tracking if new month
  if (costTracking.monthly.month !== currentMonth) {
    costTracking.monthly = { month: currentMonth, cost: 0 };
    costTracking.daily = [];
    costTracking.hourly = [];
    isBudgetLocked = false;
  }

  // Calculate current costs
  const monthlyCost = costTracking.monthly.cost;
  const dailyCost = costTracking.daily.find((d) => d.date === currentDate)?.cost || 0;
  const hourlyCost = costTracking.hourly
    .filter((h) => now - h.timestamp < 3600000) // Last hour
    .reduce((sum, h) => sum + h.cost, 0);

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
  const monthlyPercentage = ((monthlyCost + estimatedCost) / DEFAULT_BUDGET.monthlyBudget) * 100;
  if (monthlyCost + estimatedCost >= DEFAULT_BUDGET.monthlyBudget) {
    isBudgetLocked = true;
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
export function recordCost(actualCost: number): void {
  const now = Date.now();
  const currentDate = getCurrentDate();
  const currentMonth = getCurrentMonth();

  // Record hourly
  costTracking.hourly.push({ timestamp: now, cost: actualCost });

  // Clean up old hourly data (keep last 2 hours)
  costTracking.hourly = costTracking.hourly.filter((h) => now - h.timestamp < 7200000);

  // Record daily
  const dailyEntry = costTracking.daily.find((d) => d.date === currentDate);
  if (dailyEntry) {
    dailyEntry.cost += actualCost;
  } else {
    costTracking.daily.push({ date: currentDate, cost: actualCost });
  }

  // Record monthly
  if (costTracking.monthly.month === currentMonth) {
    costTracking.monthly.cost += actualCost;
  } else {
    costTracking.monthly = { month: currentMonth, cost: actualCost };
  }

  // Log to console (could be persisted to Supabase)
  if (process.env.DEBUG_AGENTS === "true") {
    console.log(`💰 Cost recorded: $${actualCost.toFixed(4)}`);
    console.log(`   Monthly: $${costTracking.monthly.cost.toFixed(2)} / $${DEFAULT_BUDGET.monthlyBudget}`);
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
🚨 BUDGET ALERT: ${level.toUpperCase()}

Current: $${currentCost.toFixed(2)} (${percentage.toFixed(1)}%)
Budget: $${budgetLimit}
Remaining: $${(budgetLimit - currentCost).toFixed(2)}

${level === "emergency" ? "⛔ ALL REQUESTS BLOCKED" : ""}
${level === "critical" ? "⚠️ APPROACHING LIMIT" : ""}
${level === "warning" ? "📊 Monitor closely" : ""}

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

  // TODO: Send email alert to admin
}

/**
 * Get current budget status
 */
export function getBudgetStatus(): {
  monthly: { used: number; limit: number; percentage: number };
  daily: { used: number; limit: number; percentage: number };
  hourly: { used: number; limit: number; percentage: number };
  isLocked: boolean;
  projectedMonthlyTotal: number;
} {
  const now = Date.now();
  const currentDate = getCurrentDate();

  const monthlyCost = costTracking.monthly.cost;
  const dailyCost = costTracking.daily.find((d) => d.date === currentDate)?.cost || 0;
  const hourlyCost = costTracking.hourly
    .filter((h) => now - h.timestamp < 3600000)
    .reduce((sum, h) => sum + h.cost, 0);

  // Project monthly total based on daily average
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const avgDailyCost = monthlyCost / dayOfMonth;
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
    isLocked: isBudgetLocked,
    projectedMonthlyTotal,
  };
}

/**
 * Admin override to unlock budget (use carefully!)
 */
export function unlockBudget(adminKey: string): boolean {
  // TODO: Implement proper admin authentication
  if (adminKey === process.env.ADMIN_OVERRIDE_KEY) {
    isBudgetLocked = false;
    console.warn("⚠️ Budget manually unlocked by admin");
    return true;
  }
  return false;
}

/**
 * Reset cost tracking (for testing only)
 */
export function resetTracking(): void {
  if (process.env.NODE_ENV !== "production") {
    costTracking = {
      hourly: [],
      daily: [],
      monthly: { month: getCurrentMonth(), cost: 0 },
    };
    isBudgetLocked = false;
    console.log("✅ Cost tracking reset");
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
