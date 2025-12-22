export type TaskType = "content" | "analysis" | "planning";

export type RiskTolerance = "low" | "medium" | "high";

export type ModelTier = "premium" | "standard" | "economy";

export interface IntelligenceRequest {
  task: TaskType;
  input: string;
  audience?: string;
  tone?: string;
  maxTokens?: number;
  budgetCents?: number;
  risk: RiskTolerance;
  metadata?: Record<string, string | number | boolean>;
}

export interface ModelConfig {
  model: string;
  provider: "openai" | "anthropic" | "fireworks";
  tier: ModelTier;
  contextWindow: number;
  maxOutputTokens: number;
  costPerMillionTokens: number;
  supportsJson: boolean;
  highRiskAllowed: boolean;
}

export interface RoutingDecision {
  selected: ModelConfig;
  fallback?: ModelConfig;
  reason: string;
  trace: RoutingTrace[];
}

export interface RoutingTrace {
  step: string;
  detail: string;
}

export interface PromptTemplate {
  id: string;
  task: TaskType;
  title: string;
  system: string;
  user: string;
  schemaHint?: string;
}

export interface StructuredResult<T> {
  data: T;
  model: string;
  usedTokens: number;
  promptId: string;
  latencyMs: number;
  traceId: string;
}

export interface ValidationResult<T> {
  ok: true;
  value: T;
} | {
  ok: false;
  issues: string[];
};
