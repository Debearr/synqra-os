import { AppError } from "./errors";
import { logSafeguard, ensureCorrelationId } from "./logging";

export type BudgetDecision = {
  allowed: boolean;
  reason: string;
  level: "none" | "warning" | "critical";
  correlationId: string;
  remainingDaily?: number;
  remainingMonthly?: number;
};

type BudgetConfig = {
  enabled: boolean;
  failClosed: boolean;
  perRequestMax: number;
  dailyCap: number;
  monthlyCap: number;
};

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getConfig(): BudgetConfig {
  const enabled = (process.env.SAFEGUARDS_ENABLED ?? "true").toLowerCase() !== "false";
  const failClosed = (process.env.SAFEGUARDS_FAIL_CLOSED ?? "true").toLowerCase() !== "false";

  return {
    enabled,
    failClosed,
    perRequestMax: toNumber(process.env.SAFEGUARDS_MAX_REQ_COST_USD, 0.05),
    dailyCap: toNumber(process.env.SAFEGUARDS_MAX_DAILY_COST_USD, 7),
    monthlyCap: toNumber(process.env.SAFEGUARDS_MAX_MONTHLY_COST_USD, 200),
  };
}

export function evaluateBudget(options: {
  estimatedCost: number;
  dailyTotal?: number;
  monthlyTotal?: number;
  scope?: string;
  correlationId?: string | null;
}): BudgetDecision {
  const config = getConfig();
  const correlationId = ensureCorrelationId(options.correlationId);

  if (!config.enabled) {
    return {
      allowed: true,
      reason: "Safeguards disabled",
      level: "none",
      correlationId,
    };
  }

  const dailyTotal = options.dailyTotal ?? 0;
  const monthlyTotal = options.monthlyTotal ?? 0;

  // Per-request cap
  if (options.estimatedCost > config.perRequestMax) {
    const reason = `Request exceeds cap ($${options.estimatedCost.toFixed(
      4
    )} > $${config.perRequestMax.toFixed(2)})`;
    logSafeguard({
      level: "warn",
      message: reason,
      scope: options.scope || "budget",
      correlationId,
      data: { estimatedCost: options.estimatedCost },
    });

    if (config.failClosed) {
      return {
        allowed: false,
        reason,
        level: "critical",
        correlationId,
      };
    }
  }

  // Daily cap
  if (dailyTotal + options.estimatedCost > config.dailyCap) {
    const reason = "Daily cost cap reached";
    logSafeguard({
      level: "warn",
      message: reason,
      scope: options.scope || "budget",
      correlationId,
      data: { dailyTotal, estimatedCost: options.estimatedCost },
    });

    if (config.failClosed) {
      return {
        allowed: false,
        reason,
        level: "critical",
        correlationId,
        remainingDaily: Math.max(0, config.dailyCap - dailyTotal),
        remainingMonthly: Math.max(0, config.monthlyCap - monthlyTotal),
      };
    }
  }

  // Monthly cap
  if (monthlyTotal + options.estimatedCost > config.monthlyCap) {
    const reason = "Monthly cost cap reached";
    logSafeguard({
      level: "warn",
      message: reason,
      scope: options.scope || "budget",
      correlationId,
      data: { monthlyTotal, estimatedCost: options.estimatedCost },
    });

    if (config.failClosed) {
      return {
        allowed: false,
        reason,
        level: "critical",
        correlationId,
        remainingDaily: Math.max(0, config.dailyCap - dailyTotal),
        remainingMonthly: Math.max(0, config.monthlyCap - monthlyTotal),
      };
    }
  }

  return {
    allowed: true,
    reason: "Within budget",
    level: "none",
    correlationId,
    remainingDaily: Math.max(0, config.dailyCap - dailyTotal - options.estimatedCost),
    remainingMonthly: Math.max(0, config.monthlyCap - monthlyTotal - options.estimatedCost),
  };
}

/**
 * Fail-closed helper: throws when a request should be blocked.
 */
export function enforceBudget(options: Parameters<typeof evaluateBudget>[0]): void {
  const decision = evaluateBudget(options);
  if (!decision.allowed) {
    throw new AppError({
      message: decision.reason,
      code: "budget_cap_reached",
      status: 429,
      safeMessage:
        "We paused this action to protect your budget. Please try again later or lower the cost.",
      details: { correlationId: decision.correlationId },
    });
  }
}
