/**
 * ============================================================
 * AI ROUTER ORCHESTRATOR
 * ============================================================
 * Main orchestration class that ties everything together
 */

import type { InferenceOptions, InferenceResult, ModelProvider } from './types';
import { taskClassifier } from './routing/classifier';
import { modelRouter } from './routing/router';
import { modelManager } from './models/manager';
import { cacheManager } from './cache/manager';
import { brandAlignmentChecker } from './guardrails/brand-alignment';
import { safetyChecker } from './guardrails/safety';
import { AI_ROUTER_CONFIG } from './config';

export class AIRouterOrchestrator {
  /**
   * Main inference method - routes and executes
   */
  async infer(
    input: string,
    options: InferenceOptions = {}
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    
    // Step 1: Check cache first
    if (options.cache !== false) {
      const cached = await cacheManager.get(input, options);
      if (cached) {
        return {
          output: cached,
          model: 'cache' as ModelProvider,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: Date.now() - startTime,
          costUsd: 0,
          cacheHit: true,
        };
      }
    }
    
    // Step 2: Classify task
    const classification = taskClassifier.classify(input);
    
    // Step 3: Route to appropriate model
    const routing = modelRouter.route(classification);
    const healthScores = modelManager.getAllHealth();
    const selectedModel = modelRouter.getBestAvailableModel(
      routing.model,
      routing.fallbackChain,
      healthScores
    );
    
    console.log(`🎯 Routing: ${routing.reason} → ${selectedModel}`);
    
    // Step 4: Execute inference with fallback chain
    let result: InferenceResult;
    let lastError: Error | null = null;
    
    const modelsToTry = [selectedModel, ...routing.fallbackChain];
    
    for (const model of modelsToTry) {
      try {
        result = await this.executeInference(model, input, options);
        
        // Step 5: Run guardrails
        const guardrailsPassed = await this.checkGuardrails(result.output);
        
        if (guardrailsPassed) {
          // Step 6: Cache successful result
          if (options.cache !== false) {
            await cacheManager.set(input, result.output, options);
          }
          
          // Step 7: Log and return
          await this.logInference(input, result, classification);
          modelManager.updateHealth(model, true);
          
          return result;
        } else {
          console.warn(`⚠️ Guardrails failed for ${model}, trying fallback`);
          lastError = new Error('Guardrails check failed');
          modelManager.updateHealth(model, false);
          continue;
        }
      } catch (error) {
        console.error(`❌ Inference failed with ${model}:`, error);
        lastError = error as Error;
        modelManager.updateHealth(model, false);
        continue;
      }
    }
    
    // All models failed - return cached safe response or error
    throw lastError || new Error('All models failed');
  }
  
  /**
   * Execute inference with a specific model
   */
  private async executeInference(
    model: ModelProvider,
    input: string,
    options: InferenceOptions
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    
    // Load model
    const modelInstance = await modelManager.loadModel(model);
    
    // Execute based on model type
    let output: string;
    let inputTokens: number;
    let outputTokens: number;
    
    if (model === 'claude') {
      const result = await this.executeClaude(modelInstance, input, options);
      output = result.output;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    } else if (model === 'gpt4') {
      const result = await this.executeGPT4(modelInstance, input, options);
      output = result.output;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    } else if (model === 'deepseek') {
      const result = await this.executeDeepSeek(modelInstance, input, options);
      output = result.output;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
    
    const latencyMs = Date.now() - startTime;
    const costUsd = this.calculateCost(model, inputTokens, outputTokens);
    
    return {
      output,
      model,
      inputTokens,
      outputTokens,
      latencyMs,
      costUsd,
      cacheHit: false,
    };
  }
  
  /**
   * Execute Claude inference
   */
  private async executeClaude(
    client: any,
    input: string,
    options: InferenceOptions
  ): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
    });
    
    const output = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
    
    return {
      output,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }
  
  /**
   * Execute GPT-4 inference
   */
  private async executeGPT4(
    client: any,
    input: string,
    options: InferenceOptions
  ): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
    // TODO: Implement OpenAI API call
    throw new Error('GPT-4 not implemented yet');
  }
  
  /**
   * Execute DeepSeek inference
   */
  private async executeDeepSeek(
    model: any,
    input: string,
    options: InferenceOptions
  ): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
    // TODO: Implement HuggingFace transformers call
    throw new Error('DeepSeek not implemented yet');
  }
  
  /**
   * Check all guardrails
   */
  private async checkGuardrails(output: string): Promise<boolean> {
    // Safety check
    const safetyResult = await safetyChecker.check(output);
    if (!safetyResult.isSafe) {
      console.warn('❌ Safety check failed:', safetyResult);
      return false;
    }
    
    // Brand alignment check
    const brandResult = await brandAlignmentChecker.check(output);
    if (!brandResult.aligned) {
      console.warn('❌ Brand alignment check failed:', brandResult);
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculate cost for inference
   */
  private calculateCost(
    model: ModelProvider,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = AI_ROUTER_CONFIG.pricing[model];
    if (!pricing) return 0;
    
    return (inputTokens / 1000 * pricing.input) + (outputTokens / 1000 * pricing.output);
  }
  
  /**
   * Log inference for observability
   */
  private async logInference(
    input: string,
    result: InferenceResult,
    classification: any
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'ai_inference',
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
      costUsd: result.costUsd,
      cacheHit: result.cacheHit,
      classification,
    };
    
    console.log(JSON.stringify(logEntry));
    
    // TODO: Store in database for dashboard
    // await supabase.from('ai_logs').insert(logEntry);
  }
  
  /**
   * Get router statistics
   */
  getStats(): Record<string, any> {
    return {
      cache: cacheManager.getStats(),
      models: modelManager.getStats(),
      health: Object.fromEntries(modelManager.getAllHealth()),
    };
  }
}

// Singleton instance
export const aiRouterOrchestrator = new AIRouterOrchestrator();
