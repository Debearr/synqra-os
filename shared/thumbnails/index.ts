/**
 * ============================================================
 * SYNQRA THUMBNAIL INTELLIGENCE SYSTEM
 * ============================================================
 * Complete export index for thumbnail generation system
 * 
 * RPRD DNA: Modular, reusable, premium
 */

// Platform Specs
export type { Platform, PlatformSpec } from "./platform-specs";
export {
  PLATFORM_SPECS,
  validateDimensions,
  getPlatformSpec,
  detectPlatform,
  getAllPlatforms,
  getRecommendedFormat,
} from "./platform-specs";

// Tier Access
export type { ThumbnailTier, TierLimits } from "./tier-access";
export {
  TIER_LIMITS,
  canGenerate,
  getTierLimits,
  hasFeature,
  getUpgradeGuidance,
  getValueLadderPosition,
} from "./tier-access";

// Cost Optimization
export type { ModelTier, TaskComplexity, ModelRoute } from "./cost-optimizer";
export {
  TASK_ROUTING,
  MODEL_MAPPING,
  COST_LIMITS_PER_TIER,
  estimateCost,
  optimizeTaskPipeline,
  getModelForTask,
  canUseCache,
  logCost,
  getCostAnalytics,
} from "./cost-optimizer";

// Anti-Abuse
export type { AbuseSignal, ThrottleAction, AbuseCheck } from "./anti-abuse";
export {
  RATE_LIMITS,
  ABUSE_THRESHOLDS,
  checkForAbuse,
  applyThrottle,
  getThrottleMessage,
  logAbuseAttempt,
} from "./anti-abuse";

// Brand DNA
export type { BrandKit } from "./brand-dna";
export {
  validateBrandKit,
  correctColors,
  enforceTypography,
  enhancePromptWithBrandDNA,
  validateAgainstBrand,
  autoHealBrandViolations,
  getBrandKit,
  saveBrandKit,
} from "./brand-dna";

// Smart Prompts
export type { PromptQuality, PromptAnalysis } from "./smart-prompts";
export {
  analyzePrompt,
  improvePrompt,
  getStrategicTips,
  getClarifyingQuestions,
  getPromptTemplates,
  autoCompletePrompt,
} from "./smart-prompts";

// Main Engine
export type { ThumbnailRequest, ThumbnailResponse, GenerationContext } from "./thumbnail-engine";
export {
  generateThumbnail,
  generateBatch,
  generateMultiPlatform,
} from "./thumbnail-engine";

// Data Routing & Intelligence
export type { ThumbnailLog, WinningPattern } from "./data-routing";
export {
  logThumbnailGeneration,
  recordSelection,
  recordPublication,
  detectWinningPatterns,
  getRecommendedPatterns,
  learnBrandPreferences,
  getThumbnailHistory,
  getPlatformAnalytics,
  findSimilarThumbnail,
  getCostSavings,
  suggestNextThumbnail,
} from "./data-routing";
