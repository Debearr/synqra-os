export type ModelTier = "fast" | "balanced" | "accurate";

export interface ModelRouteDecision {
  model: string;
  tier: ModelTier;
  reason: string;
  temperature: number;
  maxTokens: number;
}

export function routeDriverIntelModel(params: {
  task: "scoring" | "health" | "projection" | "filtering";
  priority?: "speed" | "quality" | "cost";
  payloadTokens?: number;
}): ModelRouteDecision {
  const priority = params.priority ?? "speed";
  const tokens = params.payloadTokens ?? 512;

  if (priority === "quality") {
    return {
      model: "gpt-4o-mini",
      tier: "accurate",
      reason: "Quality-first route for driver intelligence reasoning",
      temperature: 0.2,
      maxTokens: Math.min(4096, tokens * 2),
    };
  }

  if (priority === "cost") {
    return {
      model: "gpt-3.5-mini",
      tier: "fast",
      reason: "Cost-sensitive route for filter evaluation",
      temperature: 0,
      maxTokens: Math.min(2048, tokens * 2),
    };
  }

  return {
    model: "gpt-4o-mini",
    tier: "balanced",
    reason: "Default balanced route",
    temperature: params.task === "health" ? 0.1 : 0.25,
    maxTokens: Math.min(3072, tokens * 2),
  };
}
