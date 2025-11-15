/**
 * ============================================================
 * NØID LABS SHARED UTILITIES
 * ============================================================
 * Central export point for all shared utilities across
 * Synqra, NØID, and AuraFX ecosystem
 * 
 * Usage:
 *   import { aiClient, generateWithRPRD, getSupabaseClient } from '@/shared'
 * 
 * @version 1.0.0
 */

// ============================================================
// AI & CONTENT GENERATION
// ============================================================

export {
  aiClient,
  generateCreative,
  refineContent,
  generateAB,
  type AIRequest,
  type AIResponse,
  type MultiVersionRequest,
  type MultiVersionResponse,
  type ModelTier,
  type TaskType,
  type OutputMode as AIOutputMode,
} from "./ai/client";

// ============================================================
// RPRD DNA PATTERNS
// ============================================================

export {
  generateWithRPRD,
  generateABVariants,
  quickRefine,
  generatePrototype,
  generatePolished,
  validateBrandVoice,
  BRAND_VOICE,
  type RPRDRequest,
  type RPRDOutput,
  type OutputMode,
  type ContentType,
} from "./rprd/patterns";

// ============================================================
// DATABASE & INTELLIGENCE
// ============================================================

export {
  getSupabaseClient,
  getSupabaseServiceClient,
  isSupabaseConfigured,
  logIntelligence,
  trackRecipeUsage,
  getTopRecipes,
  getIntelligenceMetrics,
  supabase, // Legacy compatibility
  type IntelligenceLog,
  type RecipeUsage,
  type ContentJob,
  type ContentVariant,
  type Profile,
} from "./db/supabase";

// ============================================================
// UI COMPONENTS (LuxGrid)
// ============================================================

export {
  Logo,
  Barcode,
  Signature,
  EndCard,
  Divider,
  PageHeader,
  CTAButton,
  Tag,
  Card,
  ColorSwatch,
} from "./components/luxgrid";

// ============================================================
// PROMPTS & TEMPLATES
// ============================================================

export {
  SYSTEM_PROMPTS,
  TASK_PROMPTS,
  OUTPUT_SCHEMAS,
  REFINEMENT_PROMPTS,
  buildPrompt,
  getTaskPrompt,
  listPrompts,
} from "./prompts/library";

// ============================================================
// TYPES & VALIDATION
// ============================================================

export {
  // Core types
  type App,
  type Environment,
  type Status,
  type User,
  type Profile,
  type ContentJob,
  type ContentVariant,
  type Platform,
  type ContentType,
  
  // AI types
  type ModelTier,
  type TaskType,
  type AIUsage,
  type AIMetadata,
  
  // Validation types
  type Campaign,
  type CampaignMetrics,
  type ScheduledPost,
  type PerformanceMetrics,
  
  // Error types
  AppError,
  ValidationError,
  AIError,
  RateLimitError,
  
  // Response wrappers
  type APIResponse,
  successResponse,
  errorResponse,
  
  // Schemas
  EmailContentSchema,
  SocialPostSchema,
  CopySchema,
} from "./types";

export {
  validateContent,
  validateWithSchema,
  validateJSON,
  quickBrandCheck,
  createValidator,
  validateBatch,
  ValidationPipeline,
  type ValidationResult,
  type ValidationRule,
} from "./validation";

// ============================================================
// WORKFLOWS
// ============================================================

export {
  Workflow,
  createContentWorkflow,
  createCampaignWorkflow,
  executeWorkflow,
  type WorkflowStep,
  type WorkflowContext,
  type WorkflowResult,
  type StepResult,
  type RetryConfig,
} from "./workflows/orchestrator";

// ============================================================
// CACHE & OPTIMIZATION
// ============================================================

export {
  IntelligentCache,
  cacheManager,
  contentCache,
  promptCache,
  campaignCache,
  cached,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
} from "./cache/intelligent-cache";

export {
  AutoOptimizer,
  optimizer,
  runOptimizationCheck,
  type OptimizationRule,
  type ModelPerformance,
  type OptimizationRecommendation,
} from "./optimization/auto-optimizer";

// ============================================================
// DEV TOOLS
// ============================================================

export {
  profiler,
  logger,
  runDiagnostics,
  quickTest,
  getDashboardData,
  statusCommand,
  testCommand,
  optimizeCommand,
  type SystemHealth,
  PerformanceProfiler,
  DebugLogger,
} from "./dev/tools";

// ============================================================
// AUTONOMOUS SYSTEMS
// ============================================================

export {
  SelfHealingEngine,
  getSelfHealingEngine,
  startSelfHealing,
  IncidentResponseAutomation,
  type HealthCheck,
  type Incident,
  type RecoveryStrategy,
  type HealthStatus,
  type IncidentSeverity,
} from "./autonomous/self-healing";

export {
  EvolvingAgent,
  AgentFleetManager,
  agentFleet,
  processWithAgent,
  provideFeedback,
  type AgentProfile,
  type AgentInteraction,
  type AgentDecision,
  type LearningPattern,
} from "./autonomous/evolving-agents";
