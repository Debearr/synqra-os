/**
 * ============================================================
 * COST ESTIMATION & TRACKING
 * ============================================================
 * Estimates and tracks AI model costs before execution
 */

import { ModelProvider } from './types';

/**
 * MODEL COSTS (per 1M tokens)
 */
const MODEL_COSTS = {
  mistral: { input: 0.25, output: 0.25 },
  deepseek: { input: 0.27, output: 1.10 },
  claude: { input: 3.00, output: 15.00 },
  'gpt-5': { input: 10.00, output: 30.00 },
  cached: { input: 0, output: 0 },
} as const;

/**
 * ESTIMATE COST
 * Calculates estimated cost based on token count
 */
export function estimateCost(
  model: ModelProvider,
  tokens: { input: number; output: number }
): number {
  if (model === 'cached') return 0;
  
  const costs = MODEL_COSTS[model];
  const inputCost = (tokens.input / 1_000_000) * costs.input;
  const outputCost = (tokens.output / 1_000_000) * costs.output;
  
  return inputCost + outputCost;
}

/**
 * CALCULATE ACTUAL COST
 */
export function calculateActualCost(
  model: ModelProvider,
  actualTokens: { input: number; output: number }
): number {
  return estimateCost(model, actualTokens);
}

/**
 * ESTIMATE TOKENS FROM TEXT
 * Rough estimation: ~4 chars per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * CHECK BUDGET
 * Returns true if estimated cost is within budget
 */
export function checkBudget(
  estimatedCost: number,
  maxBudget?: number
): boolean {
  if (!maxBudget) return true;
  return estimatedCost <= maxBudget;
}

/**
 * COST COMPARISON
 * Shows savings vs alternative models
 */
export function compareCosts(
  selectedModel: ModelProvider,
  tokens: { input: number; output: number }
): Record<ModelProvider, { cost: number; savings?: number }> {
  const models: ModelProvider[] = ['mistral', 'deepseek', 'claude', 'gpt-5'];
  const costs: Record<ModelProvider, { cost: number; savings?: number }> = {
    mistral: { cost: 0 },
    deepseek: { cost: 0 },
    claude: { cost: 0 },
    'gpt-5': { cost: 0 },
    cached: { cost: 0 },
  };
  
  const selectedCost = estimateCost(selectedModel, tokens);
  
  for (const model of models) {
    const cost = estimateCost(model, tokens);
    costs[model] = {
      cost,
      savings: cost > selectedCost ? cost - selectedCost : undefined,
    };
  }
  
  return costs;
}

/**
 * MONTHLY SAVINGS PROJECTION
 * Estimates monthly savings based on usage patterns
 */
export function projectMonthlySavings(
  tasksPerDay: number,
  avgTokensPerTask: { input: number; output: number },
  currentModel: ModelProvider,
  optimizedModel: ModelProvider
): {
  currentMonthlyCost: number;
  optimizedMonthlyCost: number;
  monthlySavings: number;
  savingsPercentage: number;
} {
  const tasksPerMonth = tasksPerDay * 30;
  
  const currentCostPerTask = estimateCost(currentModel, avgTokensPerTask);
  const optimizedCostPerTask = estimateCost(optimizedModel, avgTokensPerTask);
  
  const currentMonthlyCost = currentCostPerTask * tasksPerMonth;
  const optimizedMonthlyCost = optimizedCostPerTask * tasksPerMonth;
  const monthlySavings = currentMonthlyCost - optimizedMonthlyCost;
  const savingsPercentage = (monthlySavings / currentMonthlyCost) * 100;
  
  return {
    currentMonthlyCost,
    optimizedMonthlyCost,
    monthlySavings,
    savingsPercentage,
  };
}

/**
 * COST SUMMARY
 */
export interface CostSummary {
  totalCost: number;
  breakdown: Record<ModelProvider, number>;
  taskCount: number;
  avgCostPerTask: number;
  cacheHitRate: number;
  estimatedMonthlyCost: number;
}

/**
 * GENERATE COST SUMMARY
 */
export function generateCostSummary(
  logs: Array<{ model: ModelProvider; actualCost: number; cacheHit: boolean }>
): CostSummary {
  const breakdown: Record<string, number> = {
    mistral: 0,
    deepseek: 0,
    claude: 0,
    'gpt-5': 0,
    cached: 0,
  };
  
  let totalCost = 0;
  let cacheHits = 0;
  
  for (const log of logs) {
    totalCost += log.actualCost;
    breakdown[log.model] = (breakdown[log.model] || 0) + log.actualCost;
    if (log.cacheHit) cacheHits++;
  }
  
  const taskCount = logs.length;
  const avgCostPerTask = taskCount > 0 ? totalCost / taskCount : 0;
  const cacheHitRate = taskCount > 0 ? cacheHits / taskCount : 0;
  
  // Estimate monthly cost (assuming current daily rate)
  const estimatedMonthlyCost = avgCostPerTask * taskCount * 30;
  
  return {
    totalCost,
    breakdown: breakdown as Record<ModelProvider, number>,
    taskCount,
    avgCostPerTask,
    cacheHitRate,
    estimatedMonthlyCost,
  };
}
