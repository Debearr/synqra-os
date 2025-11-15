/**
 * ============================================================
 * UNIFIED AI CLIENT - NØID LABS
 * ============================================================
 * Cost-aware AI routing across the ecosystem
 * 
 * Principles:
 * - Premium models for creative/strategic work
 * - Cheaper models for structural/formatting tasks
 * - NO new paid services (uses existing Anthropic keys)
 * - Smart caching and reuse
 * 
 * Usage:
 *   import { aiClient } from '@/shared/ai/client'
 *   const result = await aiClient.generate({...})
 */

import Anthropic from "@anthropic-ai/sdk";

// ============================================================
// TYPES
// ============================================================

export type ModelTier = "premium" | "standard" | "cheap";
export type TaskType = "creative" | "strategic" | "structural" | "formatting" | "refine";
export type OutputMode = "prototype" | "polished";

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  taskType?: TaskType;
  mode?: OutputMode;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  model: string;
  tier: ModelTier;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface MultiVersionRequest extends AIRequest {
  versions?: number; // Number of versions to generate (default: 2)
}

export interface MultiVersionResponse {
  versions: AIResponse[];
  selected?: number; // Index of selected version (if applicable)
}

// ============================================================
// MODEL CONFIGURATION
// ============================================================

const MODEL_CONFIG = {
  premium: {
    model: "claude-3-5-sonnet-20241022", // Latest Sonnet
    temperature: 0.7,
    maxTokens: 4096,
    useCases: ["creative", "strategic"],
  },
  standard: {
    model: "claude-3-5-sonnet-20241022", // Same for now, can switch to Haiku when available
    temperature: 0.5,
    maxTokens: 2048,
    useCases: ["structural", "refine"],
  },
  cheap: {
    model: "claude-3-5-sonnet-20241022", // Can use Haiku when cost matters
    temperature: 0.3,
    maxTokens: 1024,
    useCases: ["formatting", "refine"],
  },
} as const;

// Map task types to model tiers
const TASK_TO_TIER: Record<TaskType, ModelTier> = {
  creative: "premium",
  strategic: "premium",
  structural: "standard",
  formatting: "cheap",
  refine: "cheap",
};

// ============================================================
// AI CLIENT CLASS
// ============================================================

class AIClient {
  private anthropic: Anthropic | null = null;
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || "";
    this.enabled = this.apiKey.length > 0;

    if (this.enabled) {
      this.anthropic = new Anthropic({ apiKey: this.apiKey });
    } else {
      console.warn("⚠️  ANTHROPIC_API_KEY not set. AI client running in mock mode.");
    }
  }

  /**
   * Determine optimal model tier based on task type and mode
   */
  private selectTier(request: AIRequest): ModelTier {
    // If prototype mode, prefer cheaper models
    if (request.mode === "prototype") {
      return "standard";
    }

    // Use task type mapping
    if (request.taskType) {
      return TASK_TO_TIER[request.taskType];
    }

    // Default to standard
    return "standard";
  }

  /**
   * Get model configuration for a tier
   */
  private getModelConfig(tier: ModelTier) {
    return MODEL_CONFIG[tier];
  }

  /**
   * Generate a single AI response
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.enabled || !this.anthropic) {
      return this.generateMock(request);
    }

    try {
      const tier = this.selectTier(request);
      const config = this.getModelConfig(tier);

      const response = await this.anthropic.messages.create({
        model: config.model,
        max_tokens: request.maxTokens || config.maxTokens,
        temperature: request.temperature ?? config.temperature,
        system: request.systemPrompt || "",
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
      });

      const textContent = response.content
        .filter((block) => block.type === "text")
        .map((block) => ("text" in block ? block.text : ""))
        .join("\n");

      return {
        content: textContent,
        model: config.model,
        tier,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        metadata: request.metadata,
      };
    } catch (error) {
      console.error("❌ AI generation error:", error);
      return this.generateMock(request);
    }
  }

  /**
   * Generate multiple versions (RPRD DNA: Multi-Version Output)
   */
  async generateMultiVersion(request: MultiVersionRequest): Promise<MultiVersionResponse> {
    const versions = request.versions || 2;
    const results: AIResponse[] = [];

    // Generate versions with slight temperature variation
    for (let i = 0; i < versions; i++) {
      const tempBoost = i * 0.1; // Slight variation between versions
      const versionRequest = {
        ...request,
        temperature: (request.temperature || 0.7) + tempBoost,
        metadata: {
          ...request.metadata,
          versionIndex: i + 1,
        },
      };

      const result = await this.generate(versionRequest);
      results.push(result);
    }

    return {
      versions: results,
    };
  }

  /**
   * Refine existing content (RPRD DNA: Refine Step)
   * Uses cheaper model to clean up and tighten content
   */
  async refine(content: string, instructions?: string): Promise<AIResponse> {
    const prompt = instructions
      ? `${instructions}\n\nContent to refine:\n${content}`
      : `Refine the following content. Keep the meaning intact but improve clarity, structure, and premium tone. No fluff, no generic language.\n\nContent:\n${content}`;

    return this.generate({
      prompt,
      taskType: "refine",
      systemPrompt:
        "You are a premium content editor. Refine content to be clear, concise, and luxurious. Never add fluff or generic marketing speak.",
    });
  }

  /**
   * Mock generation for testing
   */
  private generateMock(request: AIRequest): AIResponse {
    const tier = this.selectTier(request);
    const mockResponses = {
      creative: "This is a mock creative response with luxury tone and strategic depth.",
      strategic: "Strategic mock response: Clear direction, executive clarity, premium positioning.",
      structural: "Mock structural response with organized flow and clean hierarchy.",
      formatting: "Mock formatted response: clean, tight, ready to deploy.",
      refine: "Refined mock: polished, precise, premium.",
    };

    const content = mockResponses[request.taskType || "structural"];

    return {
      content: `[MOCK MODE] ${content}`,
      model: "mock-model",
      tier,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
      metadata: request.metadata,
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const aiClient = new AIClient();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Quick helper for creative tasks
 */
export async function generateCreative(prompt: string, systemPrompt?: string) {
  return aiClient.generate({
    prompt,
    systemPrompt,
    taskType: "creative",
    mode: "polished",
  });
}

/**
 * Quick helper for refining content
 */
export async function refineContent(content: string, instructions?: string) {
  return aiClient.refine(content, instructions);
}

/**
 * Quick helper for multi-version output (A/B testing)
 */
export async function generateAB(prompt: string, systemPrompt?: string) {
  return aiClient.generateMultiVersion({
    prompt,
    systemPrompt,
    taskType: "creative",
    versions: 2,
  });
}
