/**
 * ============================================================
 * MODEL MANAGER
 * ============================================================
 * Lazy loading, caching, and lifecycle management for AI models
 */

import type { ModelProvider, ModelHealth } from '../types';
import { AI_ROUTER_CONFIG } from '../config';

interface LoadedModel {
  instance: any;
  loadedAt: number;
  lastUsedAt: number;
  usageCount: number;
}

export class ModelManager {
  private models: Map<ModelProvider, LoadedModel> = new Map();
  private loading: Map<ModelProvider, Promise<any>> = new Map();
  private health: Map<ModelProvider, ModelHealth> = new Map();
  
  constructor() {
    // Initialize health scores
    const providers: ModelProvider[] = ['deepseek', 'claude', 'gpt4', 'openclip', 'toxic-bert'];
    providers.forEach(provider => {
      this.health.set(provider, {
        model: provider,
        health: 1.0,
        lastSuccess: Date.now(),
        lastFailure: 0,
        consecutiveFailures: 0,
      });
    });
  }
  
  /**
   * Load model lazily (only when first needed)
   */
  async loadModel(provider: ModelProvider): Promise<any> {
    // Return cached model if already loaded
    if (this.models.has(provider)) {
      const model = this.models.get(provider)!;
      model.lastUsedAt = Date.now();
      model.usageCount++;
      return model.instance;
    }
    
    // Return in-progress load if already loading
    if (this.loading.has(provider)) {
      return await this.loading.get(provider);
    }
    
    // Start loading
    console.log(`🔄 Loading model: ${provider}`);
    const loadPromise = this.loadModelInstance(provider);
    this.loading.set(provider, loadPromise);
    
    try {
      const instance = await loadPromise;
      
      // Cache loaded model
      this.models.set(provider, {
        instance,
        loadedAt: Date.now(),
        lastUsedAt: Date.now(),
        usageCount: 1,
      });
      
      this.loading.delete(provider);
      console.log(`✅ Model loaded: ${provider}`);
      
      return instance;
    } catch (error) {
      this.loading.delete(provider);
      console.error(`❌ Failed to load model: ${provider}`, error);
      throw error;
    }
  }
  
  /**
   * Load specific model instance
   */
  private async loadModelInstance(provider: ModelProvider): Promise<any> {
    switch (provider) {
      case 'deepseek':
        return this.loadDeepSeek();
      
      case 'claude':
        return this.loadClaude();
      
      case 'gpt4':
        return this.loadGPT4();
      
      case 'openclip':
        return this.loadOpenCLIP();
      
      case 'toxic-bert':
        return this.loadToxicBERT();
      
      default:
        throw new Error(`Unknown model provider: ${provider}`);
    }
  }
  
  /**
   * Load DeepSeek model (local)
   */
  private async loadDeepSeek(): Promise<any> {
    // TODO: Implement HuggingFace transformers loading
    // For now, return mock
    if (!AI_ROUTER_CONFIG.features.enableLocalModels) {
      throw new Error('Local models disabled in config');
    }
    
    // Will implement with: @huggingface/transformers
    return {
      type: 'deepseek',
      generate: async (prompt: string) => {
        throw new Error('DeepSeek not implemented yet - need HuggingFace setup');
      }
    };
  }
  
  /**
   * Load Claude API client
   */
  private async loadClaude(): Promise<any> {
    if (!AI_ROUTER_CONFIG.features.enableExternalAPIs) {
      throw new Error('External APIs disabled in config');
    }
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    
    // Dynamic import to avoid loading if not needed
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    
    return new Anthropic({
      apiKey,
    });
  }
  
  /**
   * Load OpenAI API client
   */
  private async loadGPT4(): Promise<any> {
    if (!AI_ROUTER_CONFIG.features.enableExternalAPIs) {
      throw new Error('External APIs disabled in config');
    }
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }
    
    // Mock for now - will implement OpenAI SDK
    return {
      type: 'gpt4',
      chat: {
        completions: {
          create: async (params: any) => {
            throw new Error('GPT-4 not implemented yet - need OpenAI SDK');
          }
        }
      }
    };
  }
  
  /**
   * Load OpenCLIP model (local)
   */
  private async loadOpenCLIP(): Promise<any> {
    if (!AI_ROUTER_CONFIG.features.enableLocalModels) {
      throw new Error('Local models disabled in config');
    }
    
    // TODO: Implement HuggingFace transformers for CLIP
    return {
      type: 'openclip',
      encodeText: async (text: string) => {
        throw new Error('OpenCLIP not implemented yet - need HuggingFace setup');
      },
      encodeImage: async (image: any) => {
        throw new Error('OpenCLIP not implemented yet - need HuggingFace setup');
      }
    };
  }
  
  /**
   * Load Toxic-BERT model (local)
   */
  private async loadToxicBERT(): Promise<any> {
    if (!AI_ROUTER_CONFIG.features.enableLocalModels) {
      throw new Error('Local models disabled in config');
    }
    
    // TODO: Implement HuggingFace transformers for toxicity
    return {
      type: 'toxic-bert',
      predict: async (text: string) => {
        throw new Error('Toxic-BERT not implemented yet - need HuggingFace setup');
      }
    };
  }
  
  /**
   * Update model health after inference
   */
  updateHealth(provider: ModelProvider, success: boolean): void {
    const health = this.health.get(provider);
    if (!health) return;
    
    const now = Date.now();
    
    if (success) {
      // Success: Slowly recover health
      health.health = Math.min(1.0, health.health * AI_ROUTER_CONFIG.health.healthRecoveryFactor + 0.1);
      health.lastSuccess = now;
      health.consecutiveFailures = 0;
    } else {
      // Failure: Quickly degrade health
      health.health = Math.max(0, health.health * AI_ROUTER_CONFIG.health.healthDecayFactor);
      health.lastFailure = now;
      health.consecutiveFailures++;
    }
    
    this.health.set(provider, health);
    
    // Log health status
    if (health.health < 0.5) {
      console.warn(`⚠️ Model ${provider} health degraded: ${(health.health * 100).toFixed(1)}%`);
    }
    
    if (health.health < AI_ROUTER_CONFIG.health.disableThreshold) {
      console.error(`🚨 Model ${provider} disabled due to low health: ${(health.health * 100).toFixed(1)}%`);
    }
  }
  
  /**
   * Get health score for a model
   */
  getHealth(provider: ModelProvider): number {
    return this.health.get(provider)?.health ?? 1.0;
  }
  
  /**
   * Get all health scores
   */
  getAllHealth(): Map<ModelProvider, number> {
    const scores = new Map<ModelProvider, number>();
    this.health.forEach((health, provider) => {
      scores.set(provider, health.health);
    });
    return scores;
  }
  
  /**
   * Check if model is available (health above threshold)
   */
  isAvailable(provider: ModelProvider): boolean {
    const health = this.getHealth(provider);
    return health > AI_ROUTER_CONFIG.health.disableThreshold;
  }
  
  /**
   * Unload unused models to free memory
   */
  async unloadUnusedModels(maxIdleMs: number = 600000): Promise<void> {
    const now = Date.now();
    const toUnload: ModelProvider[] = [];
    
    this.models.forEach((model, provider) => {
      const idleTime = now - model.lastUsedAt;
      if (idleTime > maxIdleMs) {
        toUnload.push(provider);
      }
    });
    
    for (const provider of toUnload) {
      console.log(`🗑️ Unloading idle model: ${provider}`);
      this.models.delete(provider);
    }
    
    if (toUnload.length > 0) {
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }
  
  /**
   * Get model statistics
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {
      loadedModels: this.models.size,
      models: {},
    };
    
    this.models.forEach((model, provider) => {
      stats.models[provider] = {
        loadedAt: new Date(model.loadedAt).toISOString(),
        lastUsedAt: new Date(model.lastUsedAt).toISOString(),
        usageCount: model.usageCount,
        idleTimeMs: Date.now() - model.lastUsedAt,
      };
    });
    
    return stats;
  }
}

// Singleton instance
export const modelManager = new ModelManager();

// Periodic cleanup (every 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    modelManager.unloadUnusedModels();
  }, 600000);
}
