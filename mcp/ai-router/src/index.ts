/**
 * ============================================================
 * AI ROUTER MCP
 * ============================================================
 * Intelligent model routing: Llama 3.2 1B → DeepSeek → Claude/GPT
 */

import { loadEnvConfig } from '../../shared/config';
import { MCPResponse } from '../../shared/types';
import { wrapResponse, wrapError, Logger } from '../../shared/utils';

const logger = new Logger('ai-router');

export interface RouteRequest {
  query: string;
  requiresBrand?: boolean;
  maxCost?: number;
}

export interface RouteResult {
  selectedModel: 'llama-3.2-1b' | 'deepseek-v3' | 'claude-3.5-sonnet' | 'gpt-4o';
  complexity: 'simple' | 'medium' | 'high' | 'creative';
  estimatedCost: number;
  reason: string;
}

export class AIRouter {
  async route(request: RouteRequest): Promise<MCPResponse<RouteResult>> {
    const startTime = Date.now();
    
    try {
      const complexity = this.analyzeComplexity(request.query);
      const requiresBrand = request.requiresBrand || false;
      const maxCost = request.maxCost || 0.02;
      
      let selectedModel: RouteResult['selectedModel'];
      let estimatedCost: number;
      let reason: string;
      
      if (complexity === 'simple' && !requiresBrand) {
        selectedModel = 'llama-3.2-1b';
        estimatedCost = 0;
        reason = 'Simple query, local model sufficient';
      } else if (complexity === 'medium' && maxCost >= 0.008) {
        selectedModel = 'deepseek-v3';
        estimatedCost = 0.008;
        reason = 'Medium complexity, DeepSeek optimal';
      } else if (requiresBrand || complexity === 'creative') {
        selectedModel = 'claude-3.5-sonnet';
        estimatedCost = 0.015;
        reason = 'Brand-sensitive or creative work, Claude required';
      } else {
        selectedModel = 'claude-3.5-sonnet';
        estimatedCost = 0.015;
        reason = 'High complexity, premium model needed';
      }
      
      return wrapResponse({
        selectedModel,
        complexity,
        estimatedCost,
        reason,
      }, 'ai-router', startTime);
    } catch (error) {
      return wrapError(error as Error, 'ai-router', startTime);
    }
  }
  
  private analyzeComplexity(query: string): RouteResult['complexity'] {
    if (query.length < 100) return 'simple';
    if (query.length < 300) return 'medium';
    if (query.includes('creative') || query.includes('brand')) return 'creative';
    return 'high';
  }
}

export const aiRouter = new AIRouter();
