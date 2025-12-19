/**
 * ============================================================
 * AI ROUTER TYPES
 * ============================================================
 */

export type ModelProvider = 'mistral' | 'deepseek' | 'claude' | 'gpt-5' | 'cached';

export interface AITask {
  id?: string;
  type: 'generation' | 'classification' | 'validation' | 'compression' | 'reasoning';
  input: string;
  systemPrompt?: string;
  contextHistory?: string[];
  
  // Routing hints
  isClientFacing?: boolean;
  isFinalDeliverable?: boolean;
  requiresStructuredOutput?: boolean;
  requiresReasoning?: boolean;
  
  // Budget controls
  maxBudget?: number; // Max cost in USD
  tokenBudget?: number; // Max tokens
  
  // Caching
  cacheKey?: string;
  skipCache?: boolean;
  forceRefresh?: boolean;
  
  // Model override (testing)
  model?: ModelProvider;
}

export interface TaskComplexity {
  score: number; // 0-1
  reasoning: string;
  factors: {
    length: number;
    structureRequired: boolean;
    reasoningDepth: number;
    clientFacing: boolean;
  };
}

export interface RoutingDecision {
  model: ModelProvider;
  estimatedCost: number;
  actualCost: number;
  complexity?: number;
  reasoning?: string;
  tokenBudget?: number;
  requiresValidation?: boolean;
  pipeline?: string[];
  response?: any;
  fallbackChain?: ModelProvider[];
  metadata?: {
    cacheHit?: boolean;
    originalModel?: ModelProvider;
    timestamp?: number;
  };
}

export interface ModelUsageLog {
  taskId: string;
  model: ModelProvider;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  actualCost: number;
  complexity: number;
  cacheHit: boolean;
  timestamp?: number;
}

export interface CachedResponse {
  response: any;
  model: ModelProvider;
  timestamp: number;
  ttl?: number;
}

export interface CompressionResult {
  compressed: string;
  originalLength: number;
  compressedLength: number;
  compressionRatio: number;
}
