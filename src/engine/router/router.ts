import { modelRegistry, tierPreference } from "./registry";
import { buildPolicyTrace, violatesPolicy } from "./policies";
import { IntelligenceRequest, ModelConfig, RoutingDecision } from "../types";

const sortByCost = (models: ModelConfig[]): ModelConfig[] =>
  models.slice().sort((a, b) => a.costPerMillionTokens - b.costPerMillionTokens);

const filterByBudget = (
  models: ModelConfig[],
  budgetCents?: number,
): ModelConfig[] => {
  if (!budgetCents) return models;
  const budgetPerMillion = budgetCents * 10;
  return models.filter((model) => model.costPerMillionTokens <= budgetPerMillion);
};

export const routeModel = (request: IntelligenceRequest): RoutingDecision => {
  const candidates = modelRegistry[request.task];
  const affordable = filterByBudget(candidates, request.budgetCents);

  const ordered = tierPreference
    .flatMap((tier) => affordable.filter((model) => model.tier === tier))
    .filter((model) => !violatesPolicy(request, model));

  if (ordered.length === 0) {
    throw new Error("No eligible models available for the given policy and budget constraints.");
  }

  const selected = ordered[0];
  const fallback = ordered[1] ?? sortByCost(affordable).find((model) => !violatesPolicy(request, model));

  const trace = buildPolicyTrace(request, selected);

  if (fallback) {
    trace.push({ step: "routing.fallback", detail: `Fallback reserved: ${fallback.model}` });
  }

  return {
    selected,
    fallback,
    reason: `Selected ${selected.model} for task ${request.task}`,
    trace,
  };
};
