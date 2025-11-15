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
