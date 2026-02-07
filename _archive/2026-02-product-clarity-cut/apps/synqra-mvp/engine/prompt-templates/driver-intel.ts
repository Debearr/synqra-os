export const offerScoreJsonSchema = {
  type: "object",
  properties: {
    total: { type: "number" },
    normalized: { type: "number" },
    breakdown: {
      type: "object",
      properties: {
        distance: { type: "number" },
        payout: { type: "number" },
        duration: { type: "number" },
        multiStop: { type: "number" },
        weight: { type: "number" },
        rating: { type: "number" },
        custom: {
          type: "object",
          additionalProperties: { type: "number" },
        },
      },
      required: ["distance", "payout", "duration", "multiStop", "weight", "rating"],
    },
    reasons: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["total", "normalized", "breakdown", "reasons"],
};

export const driverHealthJsonSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    fatigueRisk: { type: "string", enum: ["low", "moderate", "high"] },
    hydrationStatus: { type: "string", enum: ["ok", "low", "unknown"] },
    sleepDebtHours: { type: "number" },
    cooldownMinutes: { type: "number" },
    recommendations: {
      type: "array",
      items: { type: "string" },
    },
    factors: {
      type: "object",
      additionalProperties: { type: "number" },
    },
  },
  required: [
    "score",
    "fatigueRisk",
    "hydrationStatus",
    "cooldownMinutes",
    "recommendations",
    "factors",
  ],
};

export const driverIntelSystemPrompt = `
You are the NØID Driver Intelligence orchestrator.
- Maintain factual calculations for payouts, filters, and health scores.
- Respond ONLY with JSON that matches the provided JSON schema.
- Keep reasoning concise and machine-readable.
`.trim();
