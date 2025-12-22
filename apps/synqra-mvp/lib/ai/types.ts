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
  
  /**
   * REQUIRED: Human confirmation gate.
   * AI cannot execute without explicit human approval.
   */
  confirmation: ConfirmationGate;
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

/**
 * ============================================================
 * AI CONFIRMATION GATE
 * ============================================================
 * Enforces human-in-command principle: AI must never act autonomously.
 * All AI actions require explicit human confirmation before execution.
 */

export interface ConfirmationGate {
  /**
   * Whether human confirmation has been explicitly granted.
   * Must be `true` for any AI action to execute.
   */
  confirmed: boolean;
  
  /**
   * Unique token proving confirmation was granted.
   * Generated when human approves an action.
   */
  confirmationToken?: string;
  
  /**
   * ISO timestamp when confirmation was granted.
   */
  confirmedAt?: string;
  
  /**
   * Human-readable description of what was confirmed.
   */
  confirmedAction?: string;
}

/**
 * Error thrown when AI action attempts to execute without confirmation.
 */
export class ConfirmationRequiredError extends Error {
  constructor(action: string) {
    super(`AI action requires human confirmation: ${action}`);
    this.name = 'ConfirmationRequiredError';
  }
}

/**
 * Validate that a confirmation gate has been properly authorized.
 * Throws if confirmation is missing or invalid.
 */
export function validateConfirmation(
  gate: ConfirmationGate | undefined,
  action: string
): void {
  if (!gate) {
    throw new ConfirmationRequiredError(action);
  }
  
  if (!gate.confirmed) {
    throw new ConfirmationRequiredError(action);
  }
  
  if (!gate.confirmationToken) {
    throw new ConfirmationRequiredError(`${action} (missing confirmation token)`);
  }
}

/**
 * Generate a confirmation token for human-approved actions.
 */
export function generateConfirmationToken(): string {
  return `confirm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a valid confirmation gate after human approval.
 */
export function createConfirmationGate(action: string): ConfirmationGate {
  return {
    confirmed: true,
    confirmationToken: generateConfirmationToken(),
    confirmedAt: new Date().toISOString(),
    confirmedAction: action,
  };
}
