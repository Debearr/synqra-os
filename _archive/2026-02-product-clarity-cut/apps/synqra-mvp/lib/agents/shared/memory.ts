import { Message, ConversationContext } from "../base/types";

/**
 * ============================================================
 * CONVERSATION MEMORY MANAGER
 * ============================================================
 * Handles conversation history, context retrieval, and memory management
 */

export class ConversationMemory {
  private store: Map<string, ConversationContext> = new Map();
  private maxHistoryLength: number;

  constructor(maxHistoryLength: number = 20) {
    this.maxHistoryLength = maxHistoryLength;
  }

  /**
   * Create or get conversation context
   */
  getOrCreateContext(
    conversationId: string,
    metadata?: Record<string, unknown>
  ): ConversationContext {
    let context = this.store.get(conversationId);

    if (!context) {
      const now = Date.now();
      context = {
        conversationId,
        history: [],
        metadata: metadata || {},
        createdAt: now,
        updatedAt: now,
      };
      this.store.set(conversationId, context);
    }

    return context;
  }

  /**
   * Add message to conversation
   */
  addMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metadata?: Record<string, unknown>
  ): void {
    const context = this.getOrCreateContext(conversationId);

    const message: Message = {
      role,
      content,
      timestamp: Date.now(),
      metadata,
    };

    context.history.push(message);

    // Trim history if too long
    if (context.history.length > this.maxHistoryLength) {
      context.history = context.history.slice(-this.maxHistoryLength);
    }

    context.updatedAt = Date.now();
    this.store.set(conversationId, context);
  }

  /**
   * Add message with lightweight deduplication
   */
  addMessageSmart(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metadata?: Record<string, unknown>
  ): void {
    const context = this.getOrCreateContext(conversationId);
    const recentMessages = context.history.slice(-5);

    const isDuplicate = recentMessages.some(
      (msg) => msg.role === role && this.similarityScore(msg.content, content) > 0.9
    );

    if (!isDuplicate) {
      this.addMessage(conversationId, role, content, metadata);
    }
  }

  /**
   * Get compressed context: system + last 3 exchanges
   */
  getCompressedContext(conversationId: string): string {
    const history = this.getHistory(conversationId);
    if (history.length === 0) return "";

    const first = history[0];
    const tail = history.slice(-6);
    const condensed = [first, ...tail].filter(Boolean);

    return condensed
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
  }

  private similarityScore(a: string, b: string): number {
    const aWords = new Set(a.toLowerCase().split(/\s+/));
    const bWords = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...aWords].filter((w) => bWords.has(w)).length;
    const union = new Set([...aWords, ...bWords]).size || 1;
    return intersection / union;
  }

  /**
   * Get conversation history
   */
  getHistory(
    conversationId: string,
    limit?: number
  ): Message[] {
    const context = this.store.get(conversationId);
    if (!context) return [];

    const history = context.history;
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  /**
   * Get conversation metadata
   */
  getMetadata(conversationId: string): Record<string, unknown> {
    const context = this.store.get(conversationId);
    return context?.metadata || {};
  }

  /**
   * Update conversation metadata
   */
  updateMetadata(
    conversationId: string,
    metadata: Record<string, unknown>
  ): void {
    const context = this.getOrCreateContext(conversationId);
    context.metadata = { ...context.metadata, ...metadata };
    context.updatedAt = Date.now();
    this.store.set(conversationId, context);
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.store.delete(conversationId);
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    this.store.clear();
  }

  /**
   * Get all conversation IDs
   */
  getAllConversationIds(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(conversationId: string): {
    messageCount: number;
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, unknown>;
  } | null {
    const context = this.store.get(conversationId);
    if (!context) return null;

    return {
      messageCount: context.history.length,
      createdAt: context.createdAt,
      updatedAt: context.updatedAt,
      metadata: context.metadata,
    };
  }

  /**
   * Search messages by content
   */
  searchMessages(conversationId: string, query: string): Message[] {
    const history = this.getHistory(conversationId);
    const lowerQuery = query.toLowerCase();

    return history.filter((msg) =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get last N user messages
   */
  getLastUserMessages(conversationId: string, count: number): Message[] {
    const history = this.getHistory(conversationId);
    return history
      .filter((msg) => msg.role === "user")
      .slice(-count);
  }

  /**
   * Get last N assistant messages
   */
  getLastAssistantMessages(conversationId: string, count: number): Message[] {
    const history = this.getHistory(conversationId);
    return history
      .filter((msg) => msg.role === "assistant")
      .slice(-count);
  }

  /**
   * Export conversation to JSON
   */
  exportConversation(conversationId: string): string | null {
    const context = this.store.get(conversationId);
    if (!context) return null;

    return JSON.stringify(context, null, 2);
  }

  /**
   * Import conversation from JSON
   */
  importConversation(json: string): boolean {
    try {
      const context: ConversationContext = JSON.parse(json);
      this.store.set(context.conversationId, context);
      return true;
    } catch (error) {
      console.error("Failed to import conversation:", error);
      return false;
    }
  }
}

// Global conversation memory instance
export const conversationMemory = new ConversationMemory();
