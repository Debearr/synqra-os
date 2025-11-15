/**
 * ============================================================
 * AI ROUTER - MAIN ENTRY POINT
 * ============================================================
 * Export all AI routing functionality
 */

// Core routing
export { route, executeTask, batchProcess, TOKEN_LIMITS } from './router';

// Types
export type { 
  ModelProvider, 
  AITask, 
  TaskComplexity, 
  RoutingDecision,
  ModelUsageLog,
  CachedResponse,
  CompressionResult,
} from './types';

// Complexity scoring
export { scoreComplexity, analyzeInputPatterns, detectTaskType } from './complexity';

// Cost estimation
export { 
  estimateCost, 
  calculateActualCost, 
  estimateTokens,
  checkBudget,
  compareCosts,
  projectMonthlySavings,
  generateCostSummary,
} from './cost';

// Compression
export { 
  compressInput, 
  reduceContext, 
  smartSummarize,
  precompressInput,
  batchCompress,
} from './compression';

// Caching
export {
  getCachedResponse,
  setCachedResponse,
  invalidateCache,
  clearCache,
  getCacheStats,
  warmCache,
  cleanupCache,
  startCacheCleanup,
  stopCacheCleanup,
  generateCacheKey,
} from './cache';

// Logging
export {
  logModelUsage,
  getUsageStats,
  generateCostReport,
  SUPABASE_TABLE_SQL,
} from './logging';

// Templates
export {
  getTemplate,
  getTemplatesByCategory,
  applyTemplate,
  searchTemplates,
  TEMPLATES,
} from './templates';

export type { Template } from './templates';

// Recipes
export {
  loadRecipe,
  executeRecipe,
  listRecipes,
  searchRecipes,
  getRecipeStats,
  testRecipe,
} from './recipes';

export type { Recipe, RecipeExecution } from './recipes';

/**
 * QUICK START EXAMPLE
 * 
 * import { executeTask } from '@/lib/ai';
 * 
 * const result = await executeTask({
 *   type: 'generation',
 *   input: 'Generate a landing page for Synqra',
 *   isClientFacing: true,
 *   maxBudget: 0.10, // $0.10 max
 * });
 */
