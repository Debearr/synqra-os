/**
 * Legacy AI router (deprecated).
 * Delegates to unified core in lib/ai-router.ts with brand adapters.
 */

import type { AITask, RoutingDecision, ModelProvider } from "./types";
import { validateConfirmation } from "./types";
import { resolveRouting } from "@/lib/ai-router";
import {
  buildBrandPrompt,
  routeAiRequestWithAdapter,
  type AiRouterBrand,
} from "@/lib/ai/adapters";

export const TOKEN_LIMITS = {
  mistral: 350,
  deepseek: 600,
  claude: 1200,
  "gpt-5": 1500,
} as const;

const PROVIDER_TO_MODEL: Record<string, ModelProvider> = {
  openrouter: "claude",
  gemini: "mistral",
};

function buildRequest(task: AITask, brand: AiRouterBrand, userId?: string) {
  return {
    task: task.type,
    prompt: buildBrandPrompt({
      systemPrompt: task.systemPrompt,
      userPrompt: task.input,
      contextHistory: task.contextHistory,
      brand,
    }),
    userId,
    cacheKey: task.cacheKey,
    skipCache: task.skipCache,
    forceRefresh: task.forceRefresh,
    metadata: {
      traceId: task.id,
      taskId: task.id,
      requestedModel: task.model,
      maxBudget: task.maxBudget,
      tokenBudget: task.tokenBudget,
      source: "legacy-ai-router",
    },
  };
}

export async function route(
  task: AITask,
  options?: { brand?: AiRouterBrand }
): Promise<RoutingDecision> {
  void options;
  const routing = resolveRouting(task.type);
  const mapped = PROVIDER_TO_MODEL[routing.provider] ?? "mistral";

  return {
    model: mapped,
    estimatedCost: 0,
    actualCost: 0,
    tokenBudget: task.tokenBudget,
    requiresValidation: false,
    metadata: {
      cacheHit: false,
      originalModel: mapped,
      timestamp: Date.now(),
    },
  };
}

export async function executeTask(
  task: AITask,
  options?: { brand?: AiRouterBrand; userId?: string }
): Promise<string> {
  validateConfirmation(task.confirmation, `AI task execution: ${task.type}`);

  const brand = options?.brand ?? "synqra";
  const request = buildRequest(task, brand, options?.userId);
  const response = await routeAiRequestWithAdapter(brand, request);

  return response.text;
}

export async function batchProcess(
  tasks: AITask[],
  options?: { brand?: AiRouterBrand; userId?: string }
): Promise<string[]> {
  const results: string[] = [];
  for (const task of tasks) {
    const result = await executeTask(task, options);
    results.push(result);
  }
  return results;
}
