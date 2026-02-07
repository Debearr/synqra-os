import aiRouterConfig from "@/config/ai-router.json";
import { routeAiRequest, type AiRouterRequest, type AiRouterResponse } from "@/lib/ai-router";
import { injectBrandVoice, SYNQRA_VOICE, AURAFX_VOICE, NOID_VOICE } from "@/lib/brand/synqra-voice";

export type AiRouterBrand = "synqra" | "aurafx" | "noid";

export interface AiRouterAdapterConfig {
  brand: AiRouterBrand;
  tone: string[];
  allowedModels: string[];
  maxTokens: number | null;
  safety: "standard" | "strict";
  enforceBrand: boolean;
}

const DEFAULT_ALLOWED_MODELS = [
  aiRouterConfig.providers.gemini.model,
  aiRouterConfig.providers.openrouter.model,
].filter((model): model is string => Boolean(model));

export const AI_ROUTER_ADAPTERS: Record<AiRouterBrand, AiRouterAdapterConfig> = {
  synqra: {
    brand: "synqra",
    tone: SYNQRA_VOICE.tone,
    allowedModels: DEFAULT_ALLOWED_MODELS,
    maxTokens: null,
    safety: "standard",
    enforceBrand: true,
  },
  aurafx: {
    brand: "aurafx",
    tone: AURAFX_VOICE.tone,
    allowedModels: DEFAULT_ALLOWED_MODELS,
    maxTokens: null,
    safety: "strict",
    enforceBrand: true,
  },
  noid: {
    brand: "noid",
    tone: NOID_VOICE.tone,
    allowedModels: DEFAULT_ALLOWED_MODELS,
    maxTokens: null,
    safety: "standard",
    enforceBrand: true,
  },
};

export function buildAdapterMetadata(
  brand: AiRouterBrand,
  metadata?: Record<string, unknown>
): Record<string, unknown> {
  const adapter = AI_ROUTER_ADAPTERS[brand];
  return {
    ...metadata,
    brand: adapter.brand,
    tone: adapter.tone,
    allowedModels: adapter.allowedModels,
    maxTokens: adapter.maxTokens,
    safety: adapter.safety,
    enforceBrand: adapter.enforceBrand,
  };
}

export function buildBrandPrompt(input: {
  systemPrompt?: string;
  userPrompt: string;
  contextHistory?: string[];
  brand: AiRouterBrand;
}): string {
  const system = injectBrandVoice(input.systemPrompt, input.brand);
  const sections: string[] = [];

  if (system) {
    sections.push(`System:\n${system}`);
  }

  if (input.contextHistory && input.contextHistory.length > 0) {
    sections.push(`Context:\n${input.contextHistory.join("\n")}`);
  }

  sections.push(`User:\n${input.userPrompt}`);

  return sections.join("\n\n");
}

export async function routeAiRequestWithAdapter(
  brand: AiRouterBrand,
  request: AiRouterRequest
): Promise<AiRouterResponse> {
  return routeAiRequest({
    ...request,
    metadata: buildAdapterMetadata(brand, request.metadata),
  });
}

export function routeSynqraAiRequest(request: AiRouterRequest): Promise<AiRouterResponse> {
  return routeAiRequestWithAdapter("synqra", request);
}

export function routeAuraFxAiRequest(request: AiRouterRequest): Promise<AiRouterResponse> {
  return routeAiRequestWithAdapter("aurafx", request);
}

export function routeNoidAiRequest(request: AiRouterRequest): Promise<AiRouterResponse> {
  return routeAiRequestWithAdapter("noid", request);
}
