/**
 * ============================================================
 * AVATAR ENGINE - CORE TYPES
 * ============================================================
 * Phase 1: fully functional routing + synthesis
 * Phase 2: scaffolded hooks for live streaming + adaptation
 */

export type AvatarModelName =
  | "claude"
  | "deepseek"
  | "gemini"
  | "grok"
  | "comet"
  | "chatgpt";

export interface AvatarModel {
  name: AvatarModelName;
  provider: string;
  description: string;
  temperature: number;
  maxTokens: number;
  strengths: string[];
  weaknesses: string[];
  signature: string;
  idealUseCases: string[];
  fallback?: AvatarModelName;
}

export interface AvatarVoiceProfile {
  name?: string;
  tone?: string;
  cadence?: string;
  vocabulary?: string[];
  guardrails?: string[];
  audience?: string;
}

export interface AvatarInput {
  prompt: string;
  channel?: "text" | "audio" | "video";
  voice?: AvatarVoiceProfile;
  priority?: "speed" | "accuracy" | "balanced";
  maxBudgetUSD?: number;
}

export interface AvatarRoutingDecision {
  model: AvatarModelName;
  confidence: number;
  rationale: string;
  compressionApplied: boolean;
}

export interface AvatarSynthesis {
  title: string;
  summary: string;
  bullets: string[];
  guidance: string;
}

export interface AvatarRunResult {
  requestId: string;
  routing: AvatarRoutingDecision;
  modelProfile: AvatarModel;
  voiceProfile: Required<AvatarVoiceProfile>;
  synthesis: AvatarSynthesis;
  response: string;
  safety: {
    recommendation: "allow" | "review" | "block";
    reasons: string[];
  };
  metrics: {
    promptLength: number;
    estimatedTokens: number;
    phase: "phase-1";
  };
  phase2Plan: Phase2Scaffold;
  timestamp: string;
}

export interface Phase2Scaffold {
  status: "planned";
  hooks: string[];
  observability: string[];
  handoffNotes: string;
}

// ============================================================
// Avatar Commerce + Job Types
// ============================================================

export type AvatarPlan = "lite" | "pro" | "studio";

export type AvatarProviderName = "hedra" | "heygen" | "did" | "liveportrait";

export interface AvatarCostEstimate {
  plan: AvatarPlan;
  monthlyPrice: number;
  includedVideos: number;
  perVideoCap: number;
  estimatedJobCost: number;
  capped: boolean;
}

export interface AvatarJobPayload {
  jobId: string;
  userId: string;
  script: string;
  voice: AvatarVoiceProfile;
  plan: AvatarPlan;
  provider: AvatarProviderName;
  previewUrl?: string;
  sanitizedImage?: string;
  sanitizedAudio?: string;
  promptHash?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AvatarJobStatus {
  id: string;
  status: "queued" | "processing" | "completed" | "failed" | "retrying";
  progress?: number;
  resultUrl?: string;
  provider?: AvatarProviderName;
  cost?: number;
  attempts?: number;
  error?: string;
  updatedAt?: string;
}

export interface AvatarUsage {
  userId: string;
  plan: AvatarPlan;
  videosGenerated: number;
  costToDate: number;
  windowStart: string;
  windowEnd: string;
  perceptualHash?: string | null;
}

export interface KieAIValidationResult {
  sanitizedScript: string;
  riskScore: number;
  flags: string[];
  topics: string[];
}
