/**
 * ============================================================
 * AGENT CONFIGURATION
 * ============================================================
 * Environment-based configuration for agents
 */

export const agentConfig = {
  // Anthropic API
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
  },

  // Agent behavior
  agent: {
    mode: (process.env.AGENT_MODE || "mock") as "mock" | "live",
    maxTokens: parseInt(process.env.AGENT_MAX_TOKENS || "4096", 10),
    temperature: parseFloat(process.env.AGENT_TEMPERATURE || "0.7"),
  },

  // Voice providers
  voice: {
    sttProvider: process.env.STT_PROVIDER || "mock",
    ttsProvider: process.env.TTS_PROVIDER || "mock",
  },

  // RAG configuration
  rag: {
    enabled: process.env.RAG_ENABLED === "true",
    maxDocuments: parseInt(process.env.RAG_MAX_DOCUMENTS || "5", 10),
    minSimilarity: parseFloat(process.env.RAG_MIN_SIMILARITY || "0.7"),
  },

  // Memory configuration
  memory: {
    conversationHistoryLimit: parseInt(
      process.env.CONVERSATION_HISTORY_LIMIT || "20",
      10
    ),
  },

  // Safety configuration
  safety: {
    hallucinationCheck: process.env.HALLUCINATION_CHECK === "true",
    dualPassValidation: process.env.DUAL_PASS_VALIDATION === "true",
    minConfidenceThreshold: parseFloat(
      process.env.MIN_CONFIDENCE_THRESHOLD || "0.6"
    ),
  },

  // Development
  dev: {
    debugAgents: process.env.DEBUG_AGENTS === "true",
    mockDelayMs: parseInt(process.env.MOCK_DELAY_MS || "1500", 10),
  },
};

// Validate configuration
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if we're in live mode
  if (agentConfig.agent.mode === "live") {
    if (!agentConfig.anthropic.apiKey) {
      errors.push("ANTHROPIC_API_KEY is required in live mode");
    }

    if (
      !agentConfig.anthropic.apiKey.startsWith("sk-ant-") &&
      agentConfig.anthropic.apiKey !== ""
    ) {
      errors.push("ANTHROPIC_API_KEY appears to be invalid");
    }
  }

  // Validate numeric ranges
  if (
    agentConfig.agent.temperature < 0 ||
    agentConfig.agent.temperature > 1
  ) {
    errors.push("AGENT_TEMPERATURE must be between 0 and 1");
  }

  if (agentConfig.agent.maxTokens < 1 || agentConfig.agent.maxTokens > 8192) {
    errors.push("AGENT_MAX_TOKENS must be between 1 and 8192");
  }

  if (
    agentConfig.rag.minSimilarity < 0 ||
    agentConfig.rag.minSimilarity > 1
  ) {
    errors.push("RAG_MIN_SIMILARITY must be between 0 and 1");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Log configuration status
export function logConfigStatus(): void {
  if (agentConfig.dev.debugAgents) {
    console.log("🤖 Agent Configuration:");
    console.log(`   Mode: ${agentConfig.agent.mode}`);
    console.log(
      `   Model: ${agentConfig.anthropic.model || "not configured"}`
    );
    console.log(`   RAG: ${agentConfig.rag.enabled ? "enabled" : "disabled"}`);
    console.log(
      `   Safety: ${agentConfig.safety.hallucinationCheck ? "enabled" : "disabled"}`
    );

    const validation = validateConfig();
    if (!validation.valid) {
      console.warn("⚠️  Configuration warnings:");
      validation.errors.forEach((err) => console.warn(`   - ${err}`));
    }
  }
}
