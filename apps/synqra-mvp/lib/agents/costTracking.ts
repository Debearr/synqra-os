/**
 * ============================================================
 * AGENT COST TRACKING & ANALYTICS
 * ============================================================
 * Monitor and optimize AI agent costs
 */

export interface CostMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageCostPerRequest: number;
  costByTier: {
    quick: number;
    standard: number;
    detailed: number;
  };
  tokensByTier: {
    quick: number;
    standard: number;
    detailed: number;
  };
}

// In-memory cost tracking (could be persisted to Supabase)
let costMetrics: CostMetrics = {
  totalRequests: 0,
  totalTokens: 0,
  totalCost: 0,
  averageCostPerRequest: 0,
  costByTier: { quick: 0, standard: 0, detailed: 0 },
  tokensByTier: { quick: 0, standard: 0, detailed: 0 },
};

/**
 * Record an agent invocation for cost tracking
 */
export function trackAgentCost(
  tier: "quick" | "standard" | "detailed",
  tokens: number,
  cost: number
): void {
  costMetrics.totalRequests += 1;
  costMetrics.totalTokens += tokens;
  costMetrics.totalCost += cost;
  costMetrics.averageCostPerRequest =
    costMetrics.totalCost / costMetrics.totalRequests;

  costMetrics.costByTier[tier] += cost;
  costMetrics.tokensByTier[tier] += tokens;
}

/**
 * Get current cost metrics
 */
export function getCostMetrics(): CostMetrics {
  return { ...costMetrics };
}

/**
 * Reset cost tracking (for testing or period resets)
 */
export function resetCostMetrics(): void {
  costMetrics = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageCostPerRequest: 0,
    costByTier: { quick: 0, standard: 0, detailed: 0 },
    tokensByTier: { quick: 0, standard: 0, detailed: 0 },
  };
}

/**
 * Project monthly costs based on current usage
 */
export function projectMonthlyCost(requestsPerMonth: number): {
  estimatedCost: number;
  breakdown: {
    quick: number;
    standard: number;
    detailed: number;
  };
} {
  const { averageCostPerRequest, costByTier, totalCost } = costMetrics;

  if (totalCost === 0) {
    // No data yet, use conservative estimates
    return {
      estimatedCost: requestsPerMonth * 0.015, // $0.015 per request average
      breakdown: {
        quick: requestsPerMonth * 0.3 * 0.008, // 30% quick @ $0.008
        standard: requestsPerMonth * 0.5 * 0.015, // 50% standard @ $0.015
        detailed: requestsPerMonth * 0.2 * 0.025, // 20% detailed @ $0.025
      },
    };
  }

  // Project based on actual distribution
  const totalCostByTier = costByTier.quick + costByTier.standard + costByTier.detailed;
  const quickRatio = costByTier.quick / totalCostByTier;
  const standardRatio = costByTier.standard / totalCostByTier;
  const detailedRatio = costByTier.detailed / totalCostByTier;

  return {
    estimatedCost: requestsPerMonth * averageCostPerRequest,
    breakdown: {
      quick: requestsPerMonth * averageCostPerRequest * quickRatio,
      standard: requestsPerMonth * averageCostPerRequest * standardRatio,
      detailed: requestsPerMonth * averageCostPerRequest * detailedRatio,
    },
  };
}

/**
 * Check if costs are within budget
 */
export function checkBudget(monthlyBudget: number): {
  isWithinBudget: boolean;
  projectedMonthlyCost: number;
  percentOfBudget: number;
  recommendation: string;
} {
  const projected = projectMonthlyCost(10000); // Project for 10K requests/month
  const percentOfBudget = (projected.estimatedCost / monthlyBudget) * 100;

  let recommendation = "Usage is optimal";
  if (percentOfBudget > 100) {
    recommendation = "OVER BUDGET: Increase 'quick' tier usage or reduce response lengths";
  } else if (percentOfBudget > 80) {
    recommendation = "WARNING: Approaching budget limit";
  } else if (percentOfBudget < 50) {
    recommendation = "Good: Well under budget, room for more detailed responses";
  }

  return {
    isWithinBudget: percentOfBudget <= 100,
    projectedMonthlyCost: projected.estimatedCost,
    percentOfBudget,
    recommendation,
  };
}
