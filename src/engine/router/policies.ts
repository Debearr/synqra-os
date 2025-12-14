import { IntelligenceRequest, ModelConfig, RoutingTrace } from "../types";

const restrictedPhrases = ["hate speech", "self-harm", "violence"];

export const buildPolicyTrace = (
  request: IntelligenceRequest,
  model: ModelConfig,
): RoutingTrace[] => {
  const trace: RoutingTrace[] = [
    {
      step: "input.risk",
      detail: `Risk tolerance: ${request.risk}`,
    },
    {
      step: "input.length",
      detail: `Input length: ${request.input.length} characters`,
    },
    {
      step: "model.caps",
      detail: `Model ${model.model} supports ${model.maxOutputTokens} output tokens with ${model.contextWindow} window`,
    },
  ];

  if (request.risk === "low" && !model.highRiskAllowed) {
    trace.push({ step: "policy.risk", detail: "High-risk models blocked for low tolerance" });
  }

  const containsRestricted = restrictedPhrases.some((phrase) =>
    request.input.toLowerCase().includes(phrase),
  );

  if (containsRestricted && !model.highRiskAllowed) {
    trace.push({ step: "policy.content", detail: "Restricted phrase detected; safe-only models required" });
  }

  return trace;
};

export const violatesPolicy = (
  request: IntelligenceRequest,
  model: ModelConfig,
): boolean => {
  if (request.risk === "low" && model.highRiskAllowed) {
    return true;
  }

  const containsRestricted = restrictedPhrases.some((phrase) =>
    request.input.toLowerCase().includes(phrase),
  );

  if (containsRestricted && model.highRiskAllowed) {
    return true;
  }

  return false;
};
