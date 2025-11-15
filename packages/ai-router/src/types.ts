/**
 * ============================================================
 * AI ROUTER TYPES
 * ============================================================
 * Type definitions for AI routing system
 */

export type ModelProvider = 'deepseek' | 'claude' | 'gpt4' | 'openclip' | 'toxic-bert';

export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type TaskDomain = 'code' | 'content' | 'reasoning' | 'creative';
export type TaskCriticality = 'low' | 'medium' | 'high';

export interface TaskClassification {
  complexity: TaskComplexity;
  domain: TaskDomain;
  length: number; // input tokens
  criticality: TaskCriticality;
}

export interface ModelChoice {
  primary: ModelProvider;
  fallback: ModelProvider;
  threshold?: number; // Confidence threshold for fallback
}

export interface InferenceOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  cache?: boolean;
}

export interface InferenceResult {
  output: string;
  model: ModelProvider;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  cacheHit: boolean;
  confidence?: number;
}

export interface BrandAlignmentResult {
  aligned: boolean;
  score: number;
  guidelines: string[];
}

export interface SafetyResult {
  isSafe: boolean;
  toxicity: number;
  categories: {
    toxic: number;
    severeToxic: number;
    obscene: number;
    threat: number;
    insult: number;
    identityHate: number;
  };
  recommendation: 'allow' | 'review' | 'block';
}

export interface HallucinationResult {
  isHallucination: boolean;
  confidence: number;
  reason?: string;
}

export interface CachedResult {
  value: string;
  timestamp: number;
  expiresAt: number;
  metadata?: Record<string, any>;
}

export interface ModelHealth {
  model: ModelProvider;
  health: number; // 0-1
  lastSuccess: number;
  lastFailure: number;
  consecutiveFailures: number;
}

export interface RoutingDecision {
  model: ModelProvider;
  reason: string;
  confidence: number;
  fallbackChain: ModelProvider[];
}
