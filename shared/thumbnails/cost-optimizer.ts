/**
 * ============================================================
 * ZERO-COST SCALING LOGIC
 * ============================================================
 * Smart model routing to minimize token usage without quality loss
 * 
 * RULES:
 * - Internal logic (free) → Mid-tier model → High-tier model
 * - Use expensive models only for final creative decisions
 * - Route based on task complexity
 * - Add cost guardrails to prevent runaway spending
 * 
 * RPRD DNA: Efficient, strategic, premium output
 */

import type { ThumbnailTier } from "./tier-access";

export type ModelTier = "internal" | "cheap" | "mid" | "premium";

export type TaskComplexity =
  | "validation" // Rules-based, no model needed
  | "suggestion" // Lightweight prompt improvement
  | "layout" // Structural decisions
  | "creative" // Visual design + composition
  | "refinement"; // Quality polish

export type ModelRoute = {
  task: TaskComplexity;
  recommendedModel: ModelTier;
  maxTokens: number;
  estimatedCost: number; // in cents
  canUseCache: boolean;
};

/**
 * Route tasks to appropriate model tiers
 */
export const TASK_ROUTING: Record<TaskComplexity, ModelRoute> = {
  validation: {
    task: "validation",
    recommendedModel: "internal",
    maxTokens: 0,
    estimatedCost: 0,
    canUseCache: true,
  },

  suggestion: {
    task: "suggestion",
    recommendedModel: "cheap",
    maxTokens: 500,
    estimatedCost: 0.1, // ~$0.001 per request
    canUseCache: true,
  },

  layout: {
    task: "layout",
    recommendedModel: "mid",
    maxTokens: 1000,
    estimatedCost: 0.5, // ~$0.005 per request
    canUseCache: true,
  },

  creative: {
    task: "creative",
    recommendedModel: "premium",
    maxTokens: 2000,
    estimatedCost: 2.0, // ~$0.02 per request
    canUseCache: false, // Creative tasks are unique
  },

  refinement: {
    task: "refinement",
    recommendedModel: "mid",
    maxTokens: 1500,
    estimatedCost: 0.8, // ~$0.008 per request
    canUseCache: true,
  },
};

/**
 * Model tier to actual model mapping
 */
export const MODEL_MAPPING: Record<
  ModelTier,
  { model: string; maxTokens: number; costPerToken: number }
> = {
  internal: {
    model: "none", // Rules-based logic
    maxTokens: 0,
    costPerToken: 0,
  },

  cheap: {
    model: "claude-3-haiku-20240307",
    maxTokens: 4096,
    costPerToken: 0.00025, // $0.25 per 1M tokens (input)
  },

  mid: {
    model: "claude-3-5-sonnet-20241022",
    maxTokens: 8192,
    costPerToken: 0.003, // $3 per 1M tokens (input)
  },

  premium: {
    model: "claude-3-5-sonnet-20241022", // Same as mid, but with higher token allocation
    maxTokens: 16384,
    costPerToken: 0.003,
  },
};

/**
 * Cost guardrails per user tier
 */
export const COST_LIMITS_PER_TIER: Record<
  ThumbnailTier,
  {
    maxCostPerRequest: number; // in cents
    maxCostPerDay: number;
    maxCostPerMonth: number;
  }
> = {
  free: {
    maxCostPerRequest: 1.0, // $0.01 per thumbnail
    maxCostPerDay: 3.0, // $0.03/day
    maxCostPerMonth: 10.0, // $0.10/month
  },

  pro: {
    maxCostPerRequest: 5.0, // $0.05 per thumbnail
    maxCostPerDay: 50.0, // $0.50/day
    maxCostPerMonth: 500.0, // $5.00/month
  },

  elite: {
    maxCostPerRequest: 10.0, // $0.10 per thumbnail
    maxCostPerDay: 200.0, // $2.00/day
    maxCostPerMonth: 2000.0, // $20.00/month
  },
};

/**
 * Calculate estimated cost for a thumbnail generation
 */
export function estimateCost(
  tasks: TaskComplexity[],
  userTier: ThumbnailTier
): {
  totalCost: number; // in cents
  breakdown: { task: TaskComplexity; cost: number }[];
  withinBudget: boolean;
  recommendation?: string;
} {
  const breakdown = tasks.map((task) => ({
    task,
    cost: TASK_ROUTING[task].estimatedCost,
  }));

  const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
  const limits = COST_LIMITS_PER_TIER[userTier];
  const withinBudget = totalCost <= limits.maxCostPerRequest;

  return {
    totalCost,
    breakdown,
    withinBudget,
    recommendation: withinBudget
      ? undefined
      : `Cost exceeds ${userTier} tier limit. Consider simplifying request or upgrading.`,
  };
}

/**
 * Optimize task pipeline to reduce cost
 */
export function optimizeTaskPipeline(
  tasks: TaskComplexity[],
  userTier: ThumbnailTier
): {
  optimizedTasks: TaskComplexity[];
  costSavings: number; // in cents
  qualityImpact: "none" | "minimal" | "moderate";
} {
  // Remove redundant tasks
  const uniqueTasks = Array.from(new Set(tasks));

  // For free tier, minimize creative passes
  if (userTier === "free") {
    const optimized = uniqueTasks.filter((t) => t !== "refinement");
    const originalCost = tasks.reduce(
      (sum, t) => sum + TASK_ROUTING[t].estimatedCost,
      0
    );
    const optimizedCost = optimized.reduce(
      (sum, t) => sum + TASK_ROUTING[t].estimatedCost,
      0
    );

    return {
      optimizedTasks: optimized,
      costSavings: originalCost - optimizedCost,
      qualityImpact: "minimal", // Refinement is optional for test drive
    };
  }

  // For Pro/Elite, keep all tasks but optimize order
  return {
    optimizedTasks: uniqueTasks,
    costSavings: 0,
    qualityImpact: "none",
  };
}

/**
 * Get model for specific task
 */
export function getModelForTask(
  task: TaskComplexity,
  userTier: ThumbnailTier
): {
  modelTier: ModelTier;
  modelName: string;
  maxTokens: number;
} {
  const route = TASK_ROUTING[task];
  let modelTier = route.recommendedModel;

  // Downgrade model for free tier on expensive tasks
  if (userTier === "free" && modelTier === "premium") {
    modelTier = "mid";
  }

  const modelConfig = MODEL_MAPPING[modelTier];

  return {
    modelTier,
    modelName: modelConfig.model,
    maxTokens: Math.min(route.maxTokens, modelConfig.maxTokens),
  };
}

/**
 * Check if cache can be used for this request
 */
export function canUseCache(
  task: TaskComplexity,
  prompt: string,
  platformSpecs: string
): {
  cacheKey: string | null;
  shouldCache: boolean;
} {
  const route = TASK_ROUTING[task];

  if (!route.canUseCache) {
    return { cacheKey: null, shouldCache: false };
  }

  // Create deterministic cache key
  const cacheKey = `thumbnail:${task}:${hashString(prompt)}:${hashString(
    platformSpecs
  )}`;

  return { cacheKey, shouldCache: true };
}

/**
 * Simple string hash for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Monitor and log cost usage
 */
export type CostLog = {
  userId: string;
  tier: ThumbnailTier;
  timestamp: Date;
  tasks: TaskComplexity[];
  totalCost: number;
  modelUsed: Record<TaskComplexity, string>;
  success: boolean;
};

export function logCost(log: CostLog): void {
  // In production, this would write to Supabase
  // For now, just log to console in dev
  if (process.env.NODE_ENV === "development") {
    console.log("[COST LOG]", {
      user: log.userId,
      tier: log.tier,
      cost: `$${(log.totalCost / 100).toFixed(4)}`,
      tasks: log.tasks,
      success: log.success,
    });
  }

  // TODO: Write to Supabase `thumbnail_cost_logs` table
}

/**
 * Get cost analytics for user (to show in dashboard)
 */
export async function getCostAnalytics(
  userId: string
): Promise<{
  todayCost: number;
  weekCost: number;
  monthCost: number;
  averageCostPerThumbnail: number;
  totalThumbnails: number;
}> {
  // TODO: Query Supabase
  // For now, return mock data
  return {
    todayCost: 0,
    weekCost: 0,
    monthCost: 0,
    averageCostPerThumbnail: 0,
    totalThumbnails: 0,
  };
}
