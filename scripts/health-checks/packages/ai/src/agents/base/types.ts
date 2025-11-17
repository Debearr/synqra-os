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
  metadata: z.record(z.string(), z.any()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// Tool call schema
export const ToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.any()),
  result: z.any().optional(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

// Agent response schema
export const AgentResponseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()).optional(),
  toolCalls: z.array(ToolCallSchema).optional(),
  reasoning: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Agent request schema
export const AgentRequestSchema = z.object({
  message: z.string(),
  conversationId: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
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
  parameters: z.ZodObject<any>;
  handler: (args: any) => Promise<any>;
}

// Conversation context
export interface ConversationContext {
  conversationId: string;
  history: Message[];
  metadata: Record<string, any>;
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
  metadata: Record<string, any>;
}

// Safety check result
export interface SafetyCheckResult {
  passed: boolean;
  confidence: number;
  flags: string[];
  reason?: string;
}

// Agent invocation options
export interface InvocationOptions {
  mode?: AgentMode;
  useRAG?: boolean;
  useSafety?: boolean;
  maxHistory?: number;
  metadata?: Record<string, any>;
}
