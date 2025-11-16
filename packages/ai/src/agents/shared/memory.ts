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
    metadata?: Record<string, any>
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
    metadata?: Record<string, any>
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
  getMetadata(conversationId: string): Record<string, any> {
    const context = this.store.get(conversationId);
    return context?.metadata || {};
  }

  /**
   * Update conversation metadata
   */
  updateMetadata(
    conversationId: string,
    metadata: Record<string, any>
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
    metadata: Record<string, any>;
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
