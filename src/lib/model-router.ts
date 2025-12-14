import { routeModel } from "../engine/router/router";
import { modelRegistry } from "../engine/router/registry";
import { IntelligenceRequest, ModelConfig, RoutingDecision, TaskType } from "../engine/types";

export interface RouterSummary {
  decision: RoutingDecision;
  alternatives: ModelConfig[];
}

export const routeWithAlternatives = (request: IntelligenceRequest): RouterSummary => {
  const decision = routeModel(request);
  const alternatives = modelRegistry[request.task].filter(
    (model) => model.model !== decision.selected.model,
  );
  return { decision, alternatives };
};

export const listModelsForTask = (task: TaskType): ModelConfig[] => {
  return modelRegistry[task];
};
