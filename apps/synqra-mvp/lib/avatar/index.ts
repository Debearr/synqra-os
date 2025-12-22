/**
 * ============================================================
 * AVATAR ENGINE - PUBLIC EXPORTS
 * ============================================================
 */

export { AvatarEngine, runAvatarEngine } from "./engine";
export { AVATAR_MODELS, DEFAULT_VOICE } from "./models";
export { AVATAR_RUNS_SQL, logAvatarRun } from "./logging";
export { sanitizeAvatarAudio, sanitizeAvatarImage } from "./validators/assets";
export { avatarQueue, avatarQueueEvents } from "./workers/queue";
export { enqueueAvatarJob, startAvatarWorker } from "./workers/generate";
export type {
  AvatarInput,
  AvatarModel,
  AvatarModelName,
  AvatarPlan,
  AvatarProviderName,
  AvatarCostEstimate,
  AvatarJobPayload,
  AvatarJobStatus,
  AvatarUsage,
  AvatarRoutingDecision,
  AvatarRunResult,
  AvatarSynthesis,
  AvatarVoiceProfile,
  Phase2Scaffold,
} from "./types";
