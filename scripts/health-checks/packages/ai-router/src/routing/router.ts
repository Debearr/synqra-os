/**
 * ============================================================
 * MODEL ROUTER
 * ============================================================
 * Routes tasks to appropriate AI models
 */

import type { 
  TaskClassification, 
  ModelChoice, 
  ModelProvider, 
  RoutingDecision 
} from '../types';
import { AI_ROUTER_CONFIG } from '../config';

export class ModelRouter {
  /**
   * Main routing decision based on task classification
   */
  route(task: TaskClassification): RoutingDecision {
    // Rule 1: Simple tasks → Always local (DeepSeek)
    if (task.complexity === 'simple') {
      return {
        model: 'deepseek',
        reason: 'Simple task routed to local model',
        confidence: 0.95,
        fallbackChain: ['claude', 'gpt4'],
      };
    }
    
    // Rule 2: Code tasks → Local first (DeepSeek excels at code)
    if (task.domain === 'code' && task.complexity === 'medium') {
      return {
        model: 'deepseek',
        reason: 'Code task routed to DeepSeek (specialized)',
        confidence: 0.85,
        fallbackChain: ['claude', 'gpt4'],
      };
    }
    
    // Rule 3: Complex reasoning OR high criticality → External (Claude)
    if (task.complexity === 'complex' || task.criticality === 'high') {
      return {
        model: 'claude',
        reason: 'Complex/critical task routed to Claude',
        confidence: 0.90,
        fallbackChain: ['gpt4', 'deepseek'],
      };
    }
    
    // Rule 4: Medium content generation → Try local first
    if (task.domain === 'content' && task.complexity === 'medium') {
      return {
        model: 'deepseek',
        reason: 'Medium content task routed to local with external fallback',
        confidence: 0.70,
        fallbackChain: ['claude', 'gpt4'],
      };
    }
    
    // Default: Try local first
    return {
      model: 'deepseek',
      reason: 'Default routing to local model',
      confidence: 0.75,
      fallbackChain: ['claude', 'gpt4'],
    };
  }
  
  /**
   * Get fallback model if primary fails
   */
  getFallback(primary: ModelProvider): ModelProvider {
    const fallbackMap: Record<ModelProvider, ModelProvider> = {
      'deepseek': 'claude',
      'claude': 'gpt4',
      'gpt4': 'deepseek',
      'openclip': 'openclip', // No fallback for specialized models
      'toxic-bert': 'toxic-bert',
    };
    
    return fallbackMap[primary] || 'claude';
  }
  
  /**
   * Check if model should be used based on health
   */
  shouldUseModel(model: ModelProvider, health: number): boolean {
    if (!AI_ROUTER_CONFIG.features.enableSelfHealing) {
      return true; // Always use if self-healing disabled
    }
    
    return health > AI_ROUTER_CONFIG.health.disableThreshold;
  }
  
  /**
   * Get best available model considering health
   */
  getBestAvailableModel(
    preferred: ModelProvider,
    fallbacks: ModelProvider[],
    healthScores: Map<ModelProvider, number>
  ): ModelProvider {
    // Try preferred first
    const preferredHealth = healthScores.get(preferred) ?? 1.0;
    if (this.shouldUseModel(preferred, preferredHealth)) {
      return preferred;
    }
    
    // Try fallbacks
    for (const fallback of fallbacks) {
      const fallbackHealth = healthScores.get(fallback) ?? 1.0;
      if (this.shouldUseModel(fallback, fallbackHealth)) {
        return fallback;
      }
    }
    
    // If all unhealthy, use preferred anyway (better than nothing)
    return preferred;
  }
}

// Singleton instance
export const modelRouter = new ModelRouter();
