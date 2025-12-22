import { ModelConfig, ModelTier, TaskType } from "../types";

type Registry = Record<TaskType, ModelConfig[]>;

const baseModels: Registry = {
  content: [
    {
      model: "gpt-4.1",
      provider: "openai",
      tier: "premium",
      contextWindow: 128_000,
      maxOutputTokens: 4_096,
      costPerMillionTokens: 30_000,
      supportsJson: true,
      highRiskAllowed: true,
    },
    {
      model: "claude-3-5-sonnet",
      provider: "anthropic",
      tier: "premium",
      contextWindow: 200_000,
      maxOutputTokens: 4_096,
      costPerMillionTokens: 24_000,
      supportsJson: true,
      highRiskAllowed: true,
    },
    {
      model: "gpt-4o-mini",
      provider: "openai",
      tier: "standard",
      contextWindow: 128_000,
      maxOutputTokens: 2_048,
      costPerMillionTokens: 3_000,
      supportsJson: true,
      highRiskAllowed: false,
    },
    {
      model: "fireworks-mixtral-8x7b",
      provider: "fireworks",
      tier: "economy",
      contextWindow: 32_000,
      maxOutputTokens: 1_024,
      costPerMillionTokens: 800,
      supportsJson: false,
      highRiskAllowed: false,
    },
  ],
  analysis: [
    {
      model: "gpt-4.1-mini",
      provider: "openai",
      tier: "standard",
      contextWindow: 64_000,
      maxOutputTokens: 1_024,
      costPerMillionTokens: 5_000,
      supportsJson: true,
      highRiskAllowed: false,
    },
    {
      model: "claude-3-haiku",
      provider: "anthropic",
      tier: "economy",
      contextWindow: 200_000,
      maxOutputTokens: 1_024,
      costPerMillionTokens: 800,
      supportsJson: true,
      highRiskAllowed: false,
    },
    {
      model: "gpt-4o",
      provider: "openai",
      tier: "premium",
      contextWindow: 128_000,
      maxOutputTokens: 4_096,
      costPerMillionTokens: 15_000,
      supportsJson: true,
      highRiskAllowed: true,
    },
  ],
  planning: [
    {
      model: "gpt-4o",
      provider: "openai",
      tier: "premium",
      contextWindow: 128_000,
      maxOutputTokens: 3_072,
      costPerMillionTokens: 15_000,
      supportsJson: true,
      highRiskAllowed: true,
    },
    {
      model: "claude-3-5-sonnet",
      provider: "anthropic",
      tier: "premium",
      contextWindow: 200_000,
      maxOutputTokens: 3_072,
      costPerMillionTokens: 24_000,
      supportsJson: true,
      highRiskAllowed: true,
    },
    {
      model: "gpt-4.1-mini",
      provider: "openai",
      tier: "standard",
      contextWindow: 64_000,
      maxOutputTokens: 2_048,
      costPerMillionTokens: 5_000,
      supportsJson: true,
      highRiskAllowed: false,
    },
  ],
};

export const modelRegistry: Registry = baseModels;

export const tierPreference: ModelTier[] = ["premium", "standard", "economy"];
