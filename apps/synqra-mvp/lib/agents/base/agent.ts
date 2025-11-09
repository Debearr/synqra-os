import Anthropic from "@anthropic-ai/sdk";
import {
  AgentConfig,
  AgentRequest,
  AgentResponse,
  Message,
  InvocationOptions,
  ConversationContext,
} from "./types";
import { agentConfig } from "./config";

/**
 * ============================================================
 * BASE AGENT CLASS
 * ============================================================
 * Foundation for all specialized agents (Sales, Support, Service)
 */

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected anthropic: Anthropic | null = null;
  protected conversationHistory: Map<string, ConversationContext> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;

    // Initialize Anthropic client only in live mode
    if (agentConfig.agent.mode === "live" && agentConfig.anthropic.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: agentConfig.anthropic.apiKey,
      });
    }
  }

  /**
   * Main invocation method - routes to mock or live implementation
   */
  async invoke(
    request: AgentRequest,
    options: InvocationOptions = {}
  ): Promise<AgentResponse> {
    const mode = options.mode || agentConfig.agent.mode;

    // Log invocation if debug enabled
    if (agentConfig.dev.debugAgents) {
      console.log(`🤖 [${this.config.name}] Invocation:`, {
        mode,
        message: request.message.substring(0, 50) + "...",
        conversationId: request.conversationId,
      });
    }

    // Route to appropriate implementation
    if (mode === "mock") {
      return this.invokeMock(request, options);
    } else {
      return this.invokeLive(request, options);
    }
  }

  /**
   * Mock implementation - no API calls, returns simulated response
   */
  protected async invokeMock(
    request: AgentRequest,
    options: InvocationOptions
  ): Promise<AgentResponse> {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, agentConfig.dev.mockDelayMs)
    );

    // Build conversation history
    const history = this.buildHistory(request, options);

    // Generate mock response based on agent role
    const mockResponse = this.generateMockResponse(request, history);

    // Update conversation history
    if (request.conversationId) {
      this.updateConversationHistory(
        request.conversationId,
        request.message,
        mockResponse.answer,
        options
      );
    }

    return mockResponse;
  }

  /**
   * Live implementation - makes actual API call to Claude
   */
  protected async invokeLive(
    request: AgentRequest,
    options: InvocationOptions
  ): Promise<AgentResponse> {
    if (!this.anthropic) {
      throw new Error(
        "Anthropic client not initialized. Check ANTHROPIC_API_KEY."
      );
    }

    try {
      // Build conversation history
      const history = this.buildHistory(request, options);

      // Prepare messages for Claude API
      const messages = this.prepareMessages(request, history);

      // Make API call
      const response = await this.anthropic.messages.create({
        model: agentConfig.anthropic.model,
        max_tokens: this.config.maxTokens || agentConfig.agent.maxTokens,
        temperature: this.config.temperature || agentConfig.agent.temperature,
        system: this.config.systemPrompt,
        messages: messages,
      });

      // Extract text content
      const textContent = response.content
        .filter((block) => block.type === "text")
        .map((block) => ("text" in block ? block.text : ""))
        .join("\n");

      // Build response
      const agentResponse: AgentResponse = {
        answer: textContent,
        confidence: 0.85, // TODO: Implement confidence scoring
        sources: [],
        reasoning: `Live response from ${agentConfig.anthropic.model}`,
        metadata: {
          model: response.model,
          stopReason: response.stop_reason,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          },
        },
      };

      // Update conversation history
      if (request.conversationId) {
        this.updateConversationHistory(
          request.conversationId,
          request.message,
          textContent,
          options
        );
      }

      return agentResponse;
    } catch (error) {
      console.error(`❌ [${this.config.name}] Error:`, error);

      // Fallback to mock on error
      console.log(`🔄 [${this.config.name}] Falling back to mock mode...`);
      return this.invokeMock(request, options);
    }
  }

  /**
   * Build conversation history
   */
  protected buildHistory(
    request: AgentRequest,
    options: InvocationOptions
  ): Message[] {
    const conversationId = request.conversationId || "default";
    const existingContext = this.conversationHistory.get(conversationId);

    // Start with existing history or request history
    const history: Message[] = request.history || existingContext?.history || [];

    // Limit history length
    const maxHistory =
      options.maxHistory || agentConfig.memory.conversationHistoryLimit;
    return history.slice(-maxHistory);
  }

  /**
   * Prepare messages for Claude API
   */
  protected prepareMessages(
    request: AgentRequest,
    history: Message[]
  ): Array<{ role: "user" | "assistant"; content: string }> {
    // Convert history to Claude format
    const messages: Array<{ role: "user" | "assistant"; content: string }> = history
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Add current user message
    messages.push({
      role: "user",
      content: request.message,
    });

    return messages;
  }

  /**
   * Update conversation history
   */
  protected updateConversationHistory(
    conversationId: string,
    userMessage: string,
    assistantMessage: string,
    options: InvocationOptions
  ): void {
    const now = Date.now();

    // Get or create conversation context
    let context = this.conversationHistory.get(conversationId);
    if (!context) {
      context = {
        conversationId,
        history: [],
        metadata: options.metadata || {},
        createdAt: now,
        updatedAt: now,
      };
    }

    // Add messages
    context.history.push({
      role: "user",
      content: userMessage,
      timestamp: now,
    });

    context.history.push({
      role: "assistant",
      content: assistantMessage,
      timestamp: now,
    });

    // Limit history length
    const maxHistory = agentConfig.memory.conversationHistoryLimit;
    if (context.history.length > maxHistory) {
      context.history = context.history.slice(-maxHistory);
    }

    context.updatedAt = now;

    // Save context
    this.conversationHistory.set(conversationId, context);
  }

  /**
   * Generate mock response - to be overridden by specialized agents
   */
  protected abstract generateMockResponse(
    request: AgentRequest,
    history: Message[]
  ): AgentResponse;

  /**
   * Get agent info
   */
  getInfo(): {
    role: string;
    name: string;
    description: string;
  } {
    return {
      role: this.config.role,
      name: this.config.name,
      description: this.config.description,
    };
  }

  /**
   * Clear conversation history
   */
  clearHistory(conversationId?: string): void {
    if (conversationId) {
      this.conversationHistory.delete(conversationId);
    } else {
      this.conversationHistory.clear();
    }
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId: string): Message[] {
    const context = this.conversationHistory.get(conversationId);
    return context?.history || [];
  }
}
