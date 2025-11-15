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

// Main AI Router class (to be implemented)
export class AIRouter {
  // TODO: Implement main orchestration class
  async infer(input: string, options?: any): Promise<any> {
    throw new Error('Not implemented yet - use blueprint/ai-routing.md for implementation guide');
  }
}

// Singleton instance
export const aiRouter = new AIRouter();
