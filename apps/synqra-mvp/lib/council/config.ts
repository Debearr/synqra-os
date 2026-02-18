export const councilConfig = {
  model: process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant",
  maxTokens: 512,
  temperature: 0.4,
  timeoutMs: 30_000,
  maxRetries: 2,
  rateLimitPerHour: 10,
  costPer1kTokens: 0.001,
} as const;
