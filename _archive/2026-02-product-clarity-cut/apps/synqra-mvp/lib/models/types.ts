/**
 * ============================================================
 * LOCAL MODEL TYPES & INTERFACES
 * ============================================================
 * Type definitions for HuggingFace model integration
 */

export type ModelType = 
  | "embeddings"
  | "sentiment"
  | "toxicity"
  | "llm"
  | "vision"
  | "ocr"
  | "audio"
  | "document"
  | "reranker";

export type ModelSize = "tiny" | "small" | "base" | "large";
export type ModelBackend = "onnx" | "transformers" | "python-service" | "api";

/**
 * Model configuration
 */
export interface ModelConfig {
  id: string;
  name: string;
  type: ModelType;
  size: ModelSize;
  backend: ModelBackend;
  
  // Resource requirements
  memoryMB: number;
  cpuIntensive: boolean;
  gpuOptional: boolean;
  
  // Loading strategy
  preload: boolean; // Load on startup
  lazyLoad: boolean; // Load on first use
  cacheResults: boolean;
  
  // HuggingFace info
  huggingFaceId?: string;
  localPath?: string;
  
  // Cost
  costPerInference: number; // In dollars
  
  // Performance
  avgLatencyMs: number;
  maxBatchSize: number;
}

/**
 * Inference request
 */
export interface InferenceRequest {
  modelId: string;
  input: string | number[] | Buffer;
  options?: {
    temperature?: number;
    maxTokens?: number;
    topK?: number;
    batchSize?: number;
  };
}

/**
 * Inference result
 */
export interface InferenceResult<T = unknown> {
  modelId: string;
  output: T;
  confidence: number;
  latencyMs: number;
  cost: number;
  cached: boolean;
  timestamp: number;
}

/**
 * Model routing decision
 */
export interface RoutingDecision {
  selectedModel: string;
  reason: string;
  complexity: "simple" | "medium" | "high" | "creative";
  confidence: number;
  fallbackModels: string[];
  estimatedCost: number;
  estimatedLatency: number;
}

/**
 * Quality validation result
 */
export interface QualityValidation {
  score: number; // 0-1
  passed: boolean;
  action: "deliver" | "rephrase" | "escalate";
  issues: string[];
  suggestions?: string[];
}

/**
 * Model performance metrics
 */
export interface ModelMetrics {
  modelId: string;
  totalInferences: number;
  successfulInferences: number;
  failedInferences: number;
  avgLatency: number;
  avgConfidence: number;
  totalCost: number;
  cacheHitRate: number;
  lastUsed: number;
}

/**
 * Self-learning data point
 */
export interface LearningDataPoint {
  input: string;
  modelUsed: string;
  outputQuality: number;
  userFeedback?: number; // -1, 0, 1
  brandConsistency?: number;
  toxicityScore?: number;
  routingDecision: string;
  costEfficiency: number;
  timestamp: number;
}
