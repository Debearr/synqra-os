import { z } from "zod";

/**
 * ============================================================
 * AGENT TYPES & SCHEMAS
 * ============================================================
 * Core type definitions for the multi-agent voice system
 */

// Agent roles
export type AgentRole = "sales" | "support" | "service";

// Agent mode
export type AgentMode = "mock" | "live";

// Message role
export type MessageRole = "user" | "assistant" | "system";

// Message schema
export const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// Tool call schema
export const ToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()),
  result: z.unknown().optional(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

// Agent response schema
export const AgentResponseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()).optional(),
  toolCalls: z.array(ToolCallSchema).optional(),
  reasoning: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tokenUsage: z.object({ // New: Track token usage for cost monitoring
    input: z.number().optional(),
    output: z.number().optional(),
    total: z.number().optional(),
    estimatedCost: z.number().optional(),
  }).optional(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Agent request schema
export const AgentRequestSchema = z.object({
  message: z.string(),
  conversationId: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  history: z.array(MessageSchema).optional(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

// Agent configuration
export interface AgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools?: ToolDefinition[];
  ragEnabled?: boolean;
  safetyLevel?: "strict" | "moderate" | "permissive";
}

// Tool definition
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<Record<string, z.ZodTypeAny>>;
  handler: {
    bivarianceHack(args: Record<string, unknown>): Promise<unknown>;
  }["bivarianceHack"];
}

// Conversation context
export interface ConversationContext {
  conversationId: string;
  history: Message[];
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// RAG context
export interface RAGContext {
  query: string;
  documents: RAGDocument[];
  maxDocuments: number;
  minSimilarity: number;
}

// RAG document
export interface RAGDocument {
  id: string;
  content: string;
  source: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

// Safety check result
export interface SafetyCheckResult {
  passed: boolean;
  confidence: number;
  flags: string[];
  reason?: string;
}

// Response tier for token budgeting
export type ResponseTier = "quick" | "standard" | "detailed";

// Agent invocation options
export interface InvocationOptions {
  mode?: AgentMode;
  useRAG?: boolean;
  useSafety?: boolean;
  maxHistory?: number;
  responseTier?: ResponseTier; // New: Control response length for cost optimization
  metadata?: Record<string, unknown>;
  
  /**
   * REQUIRED: Human confirmation gate.
   * Agent cannot respond without explicit human approval.
   */
  confirmation: AgentConfirmationGate;
}

/**
 * ============================================================
 * AGENT CONFIRMATION GATE
 * ============================================================
 * Enforces human-in-command principle for agent responses.
 * All agent actions require explicit human confirmation.
 */
export interface AgentConfirmationGate {
  /**
   * Whether human confirmation has been explicitly granted.
   */
  confirmed: boolean;
  
  /**
   * Unique token proving confirmation was granted.
   */
  confirmationToken?: string;
  
  /**
   * ISO timestamp when confirmation was granted.
   */
  confirmedAt?: string;
}

/**
 * Error thrown when agent action attempts to execute without confirmation.
 */
export class AgentConfirmationRequiredError extends Error {
  constructor(action: string) {
    super(`Agent action requires human confirmation: ${action}`);
    this.name = 'AgentConfirmationRequiredError';
  }
}

/**
 * Validate that an agent confirmation gate has been properly authorized.
 */
export function validateAgentConfirmation(
  gate: AgentConfirmationGate | undefined,
  action: string
): void {
  if (!gate) {
    throw new AgentConfirmationRequiredError(action);
  }
  
  if (!gate.confirmed) {
    throw new AgentConfirmationRequiredError(action);
  }
  
  if (!gate.confirmationToken) {
    throw new AgentConfirmationRequiredError(`${action} (missing confirmation token)`);
  }
}

/**
 * Generate a confirmation token for human-approved agent actions.
 */
export function generateAgentConfirmationToken(): string {
  return `agent_confirm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a valid agent confirmation gate after human approval.
 */
export function createAgentConfirmationGate(): AgentConfirmationGate {
  return {
    confirmed: true,
    confirmationToken: generateAgentConfirmationToken(),
    confirmedAt: new Date().toISOString(),
  };
}
