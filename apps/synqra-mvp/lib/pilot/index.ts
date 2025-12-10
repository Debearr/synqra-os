/**
 * ============================================================
 * SYNQRA ONBOARDING FOUNDATION
 * ============================================================
 * Refined onboarding system with schema validation,
 * confidence scoring, normalization, and scaffolding
 */

// Schema exports
export {
  baseProfileSchema,
  extractionSourceSchema,
  fieldMetadataSchema,
  extractedProfileSchema,
  techStartupExtensionSchema,
  agencyExtensionSchema,
  creativeExtensionSchema,
  ecommerceExtensionSchema,
  profileWithExtensionsSchema,
  profileScaffoldSchema,
  type BaseProfile,
  type ExtractionSource,
  type FieldMetadata,
  type ExtractedProfile,
  type TechStartupExtension,
  type AgencyExtension,
  type CreativeExtension,
  type EcommerceExtension,
  type ProfileWithExtensions,
  type ProfileScaffold,
} from './schema';

// Validator exports
export {
  calculateFieldConfidence,
  calculateOverallConfidence,
  validateExtractedField,
  validateExtractedProfile,
  shouldTriggerManualFallback,
  getFieldRequirements,
  getHigherPrecedenceSource,
  compareSourcePrecedence,
} from './validator';

// Normalizer exports
export {
  cleanString,
  cleanEmail,
  cleanUrl,
  cleanLinkedInUrl,
  normalizeFieldValue,
  resolveFieldConflict,
  mergeExtractedProfiles,
  normalizeExtractedProfile,
  extractBaseProfile,
  detectDuplicateData,
  detectInconsistencies,
} from './normalizer';

// Scaffold exports
export {
  buildProfileScaffold,
  buildProfileScaffoldFromMultipleSources,
  validateScaffold,
  enrichScaffoldWithManualData,
  scaffoldToJSON,
  scaffoldFromJSON,
  getScaffoldSummary,
} from './scaffold';
