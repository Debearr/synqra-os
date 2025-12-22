import { AvatarModel, AvatarModelName } from "./types";

/**
 * ============================================================
 * AVATAR ENGINE - MODEL REGISTRY
 * ============================================================
 * Mirrors Claude, DeepSeek, Gemini, Grok, Comet, and ChatGPT
 */

export const AVATAR_MODELS: Record<AvatarModelName, AvatarModel> = {
  claude: {
    name: "claude",
    provider: "Anthropic",
    description: "High-comprehension avatar for polished, client-facing output.",
    temperature: 0.4,
    maxTokens: 1200,
    strengths: ["long-form reasoning", "tone control", "safety-first"],
    weaknesses: ["slower turn-around", "conservative creativity"],
    signature: "Structured, thoughtful, always on-brief.",
    idealUseCases: ["board updates", "client memos", "executive narratives"],
    fallback: "chatgpt",
  },
  deepseek: {
    name: "deepseek",
    provider: "DeepSeek",
    description: "Validator + compressor avatar focused on precision and token discipline.",
    temperature: 0.2,
    maxTokens: 800,
    strengths: ["logic checks", "compression", "concise rewrites"],
    weaknesses: ["limited flourish", "prefers bulleting"],
    signature: "Direct, terse, confident under constraints.",
    idealUseCases: ["fact-checks", "safety sweeps", "budget-guarded runs"],
    fallback: "claude",
  },
  gemini: {
    name: "gemini",
    provider: "Google",
    description: "Multimodal strategist that balances creative framing with clarity.",
    temperature: 0.55,
    maxTokens: 1000,
    strengths: ["strategy synthesis", "multichannel guidance", "balanced tone"],
    weaknesses: ["less aggressive trimming", "softer urgency"],
    signature: "Calm, strategic, platform-aware.",
    idealUseCases: ["campaign briefs", "channel playbooks", "voice blending"],
    fallback: "chatgpt",
  },
  grok: {
    name: "grok",
    provider: "xAI",
    description: "Fast, witty avatar optimized for social velocity and creative hooks.",
    temperature: 0.7,
    maxTokens: 600,
    strengths: ["speed", "humor", "hook-first drafting"],
    weaknesses: ["lighter depth", "prefers short form"],
    signature: "Punchy, irreverent, high-velocity.",
    idealUseCases: ["tweets", "pattern interrupts", "banter-driven CTAs"],
    fallback: "comet",
  },
  comet: {
    name: "comet",
    provider: "Synqra",
    description: "In-house avatar tuned for delivery discipline and latency.",
    temperature: 0.3,
    maxTokens: 500,
    strengths: ["deterministic tone", "low latency", "tight structure"],
    weaknesses: ["less inventive", "minimal flourish"],
    signature: "Mechanical clarity with crisp CTA focus.",
    idealUseCases: ["status replies", "handoffs", "ops updates"],
    fallback: "deepseek",
  },
  chatgpt: {
    name: "chatgpt",
    provider: "OpenAI",
    description: "Generalist avatar for wide coverage and polite defaults.",
    temperature: 0.5,
    maxTokens: 900,
    strengths: ["balanced tone", "few-shot resilience", "steady cadence"],
    weaknesses: ["may hedge", "generic unless guided"],
    signature: "Helpful, concise, evenly paced.",
    idealUseCases: ["catch-all", "Q&A", "fallback synthesis"],
  },
};

export const DEFAULT_VOICE: Required<import("./types").AvatarVoiceProfile> = {
  name: "Synqra Voice",
  tone: "assured, modern, concise",
  cadence: "mid-tempo with decisive finishes",
  vocabulary: ["momentum", "clarity", "signal", "precision"],
  guardrails: ["no hallucinations", "no speculative claims", "keep to brief"],
  audience: "executive leaders",
};
