/**
 * ============================================================
 * @noid/ai-router
 * ============================================================
 * AI model routing and orchestration system
 * 
 * Features:
 * - 80% local models / 20% external APIs
 * - Intelligent task classification
 * - Multi-layer caching
 * - Brand alignment checks
 * - Safety guardrails
 * - Self-healing fallbacks
 * - Cost tracking
 * 
 * Usage:
 * import { aiRouter } from '@noid/ai-router';
 * 
 * const result = await aiRouter.infer('Generate a blog post about AI', {
 *   temperature: 0.7,
 *   cache: true,
 * });
 */

// Export configuration
export { AI_ROUTER_CONFIG } from './config';
export type { AIRouterConfig } from './config';

// Export types
export type * from './types';

// Export routing components
export { TaskClassifier, taskClassifier } from './routing/classifier';
export { ModelRouter, modelRouter } from './routing/router';

// Export model management
export { ModelManager, modelManager } from './models/manager';

// Export caching
export { CacheManager, cacheManager } from './cache/manager';

// Export guardrails
export { BrandAlignmentChecker, brandAlignmentChecker } from './guardrails/brand-alignment';
export { SafetyChecker, safetyChecker } from './guardrails/safety';

// Export orchestrator
export { AIRouterOrchestrator, aiRouterOrchestrator } from './orchestrator';

// Main AI Router class
export class AIRouter {
  /**
   * Main inference method
   */
  async infer(input: string, options?: any): Promise<any> {
    return aiRouterOrchestrator.infer(input, options);
  }
  
  /**
   * Get router statistics
   */
  getStats(): Record<string, any> {
    return aiRouterOrchestrator.getStats();
  }
  
  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    return cacheManager.clear();
  }
}

// Singleton instance
export const aiRouter = new AIRouter();
