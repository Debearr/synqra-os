import { AVATAR_MODELS, DEFAULT_VOICE } from "./models";
import type {
  AvatarInput,
  AvatarModelName,
  AvatarRoutingDecision,
  AvatarRunResult,
  AvatarSynthesis,
  AvatarVoiceProfile,
  Phase2Scaffold,
} from "./types";
import { logAvatarRun } from "./logging";

/**
 * ============================================================
 * AVATAR ENGINE - CORE EXECUTION (Phase 1)
 * ============================================================
 * - Deterministic routing to six avatar models
 * - Lightweight synthesis + safety guardrails
 * - Supabase logging for observability
 */

const ROUTING_KEYWORDS: Record<AvatarModelName, string[]> = {
  claude: ["board", "memo", "executive", "client", "policy"],
  deepseek: ["compress", "short", "trim", "budget", "guardrail"],
  gemini: ["strategy", "campaign", "omni", "multi", "framework"],
  grok: ["tweet", "x", "post", "hook", "meme", "banter"],
  comet: ["status", "update", "ops", "handoff", "log"],
  chatgpt: [],
};

const SAFETY_FLAGS = ["hallucination", "speculative", "unsafe"];

const compressPrompt = (prompt: string) =>
  prompt
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);

const normalizeVoice = (voice?: AvatarVoiceProfile): Required<AvatarVoiceProfile> => ({
  ...DEFAULT_VOICE,
  ...voice,
  vocabulary: voice?.vocabulary?.length ? voice.vocabulary : DEFAULT_VOICE.vocabulary,
  guardrails: voice?.guardrails?.length ? voice.guardrails : DEFAULT_VOICE.guardrails,
});

const estimateTokens = (prompt: string) => Math.max(32, Math.ceil(prompt.length / 4));

const buildSynthesis = (prompt: string, voice: Required<AvatarVoiceProfile>): AvatarSynthesis => {
  const trimmed = prompt.slice(0, 240);
  return {
    title: `${voice.name} synthesis`,
    summary: `${voice.tone} take tailored for ${voice.audience}.` +
      ` Emphasizes ${voice.vocabulary.slice(0, 3).join(", ")} while staying on-brief.`,
    bullets: [
      `Cadence: ${voice.cadence}`,
      `Guardrails: ${voice.guardrails.join(" · ")}`,
      `Audience: ${voice.audience}`,
    ],
    guidance: `Keep messaging grounded. Use:${voice.vocabulary.slice(0, 2).join(", ")}.
Source signal: ${trimmed}${prompt.length > 240 ? "…" : ""}`,
  };
};

const routeToAvatar = (input: AvatarInput): AvatarRoutingDecision => {
  const cleaned = compressPrompt(input.prompt);
  const scoreEntries = (Object.entries(ROUTING_KEYWORDS) as [AvatarModelName, string[]][]).map(
    ([model, keywords]) => {
      const hits = keywords.filter((keyword) => cleaned.toLowerCase().includes(keyword)).length;
      const base = model === "chatgpt" ? 0.15 : 0.05 * keywords.length;
      const priorityBoost =
        input.priority === "speed" && (model === "grok" || model === "comet")
          ? 0.12
          : input.priority === "accuracy" && (model === "claude" || model === "deepseek")
            ? 0.1
            : 0;
      return { model, score: hits * 0.2 + base + priorityBoost };
    }
  );

  const best = scoreEntries.sort((a, b) => b.score - a.score)[0];
  const model = best.score > 0 ? best.model : "chatgpt";
  const compressionApplied = cleaned.length < input.prompt.length;

  return {
    model,
    confidence: Math.min(0.95, 0.35 + best.score),
    rationale: best.score > 0 ? `Matched ${best.score.toFixed(2)} routing weight` : "Default catch-all",
    compressionApplied,
  };
};

const synthesizeResponse = (
  prompt: string,
  model: AvatarModelName,
  voice: Required<AvatarVoiceProfile>,
  synthesis: AvatarSynthesis
) => {
  const modelSignature = AVATAR_MODELS[model];
  const cadence = voice.cadence.endsWith(".") ? voice.cadence : `${voice.cadence}.`;
  const guardrailText = voice.guardrails.length ? `Guardrails: ${voice.guardrails.join(" | ")}.` : "";

  return [
    `${modelSignature.signature} (${modelSignature.provider}).`,
    `Voice: ${voice.tone}; cadence ${cadence}`,
    guardrailText,
    `Prompt focus → ${prompt.slice(0, 220)}${prompt.length > 220 ? "…" : ""}`,
    `Synthesis: ${synthesis.summary}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildPhase2Scaffold = (): Phase2Scaffold => ({
  status: "planned",
  hooks: [
    "websocket:avatar:stream",
    "supabase:avatar_runs_live",
    "stripe:webhook:avatar-upgrade",
  ],
  observability: ["latency_ms", "cache_hit_rate", "phase2_drop_reason"],
  handoffNotes: "Phase 2 will layer live adaptation + streaming outputs without breaking current API.",
});

export async function runAvatarEngine(input: AvatarInput): Promise<AvatarRunResult> {
  const routing = routeToAvatar(input);
  const modelProfile = AVATAR_MODELS[routing.model];
  const voiceProfile = normalizeVoice(input.voice);
  const cleanedPrompt = compressPrompt(input.prompt);
  const synthesis = buildSynthesis(cleanedPrompt, voiceProfile);
  const response = synthesizeResponse(cleanedPrompt, routing.model, voiceProfile, synthesis);
  const tokens = Math.min(modelProfile.maxTokens, estimateTokens(cleanedPrompt) + 120);

  const result: AvatarRunResult = {
    requestId: `avatar-${Date.now()}`,
    routing,
    modelProfile,
    voiceProfile,
    synthesis,
    response,
    safety: {
      recommendation: "allow",
      reasons: SAFETY_FLAGS.filter((flag) => cleanedPrompt.toLowerCase().includes(flag)),
    },
    metrics: {
      promptLength: cleanedPrompt.length,
      estimatedTokens: tokens,
      phase: "phase-1",
    },
    phase2Plan: buildPhase2Scaffold(),
    timestamp: new Date().toISOString(),
  };

  await logAvatarRun(result);
  return result;
}

export const AvatarEngine = {
  run: runAvatarEngine,
  models: AVATAR_MODELS,
  defaults: DEFAULT_VOICE,
};
