import { z } from 'zod';

/**
 * ============================================================
 * SYNQRA ONBOARDING SCHEMA
 * ============================================================
 * Base profile schema + industry-specific extensions
 * Supports multi-source extraction with confidence tracking
 */

// ============================================================
// CORE BASE SCHEMA
// ============================================================

export const baseProfileSchema = z.object({
  // Identity
  fullName: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),

  // Professional
  companyName: z.string().min(2).max(100).trim().optional(),
  role: z.string().min(2).max(100).trim().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),

  // Social/External
  linkedinProfile: z.string().url().optional(),
  website: z.string().url().optional(),

  // Context
  industry: z.string().min(2).max(100).optional(),
  whyPilot: z.string().min(10).max(1000).trim().optional(),
});

// ============================================================
// EXTRACTION METADATA
// ============================================================

export const extractionSourceSchema = z.enum(['url', 'document', 'image', 'manual']);

export const fieldMetadataSchema = z.object({
  value: z.any(),
  confidence: z.number().min(0).max(1),
  source: extractionSourceSchema,
  extractedAt: z.date().default(() => new Date()),
});

export const extractedProfileSchema = z.object({
  fullName: fieldMetadataSchema.optional(),
  email: fieldMetadataSchema.optional(),
  companyName: fieldMetadataSchema.optional(),
  role: fieldMetadataSchema.optional(),
  companySize: fieldMetadataSchema.optional(),
  linkedinProfile: fieldMetadataSchema.optional(),
  website: fieldMetadataSchema.optional(),
  industry: fieldMetadataSchema.optional(),
  whyPilot: fieldMetadataSchema.optional(),
});

// ============================================================
// INDUSTRY-SPECIFIC EXTENSIONS
// ============================================================

export const techStartupExtensionSchema = z.object({
  fundingStage: z.enum(['pre-seed', 'seed', 'series-a', 'series-b', 'series-c+']).optional(),
  techStack: z.array(z.string()).optional(),
  productStage: z.enum(['idea', 'mvp', 'beta', 'launched', 'scaling']).optional(),
});

export const agencyExtensionSchema = z.object({
  serviceOfferings: z.array(z.string()).optional(),
  clientTypes: z.array(z.string()).optional(),
  teamSize: z.number().int().positive().optional(),
});

export const creativeExtensionSchema = z.object({
  primaryMedium: z.enum(['video', 'photo', 'design', 'writing', 'mixed']).optional(),
  portfolioUrl: z.string().url().optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
});

export const ecommerceExtensionSchema = z.object({
  platform: z.enum(['shopify', 'woocommerce', 'custom', 'other']).optional(),
  monthlyRevenue: z.enum(['0-10k', '10k-50k', '50k-100k', '100k-500k', '500k+']).optional(),
  productCategories: z.array(z.string()).optional(),
});

// ============================================================
// UNIFIED PROFILE WITH EXTENSIONS
// ============================================================

export const profileWithExtensionsSchema = baseProfileSchema.extend({
  industryExtension: z.union([
    techStartupExtensionSchema,
    agencyExtensionSchema,
    creativeExtensionSchema,
    ecommerceExtensionSchema,
    z.object({}),
  ]).optional(),
});

// ============================================================
// PROFILE SCAFFOLD
// ============================================================

export const profileScaffoldSchema = z.object({
  // Base fields (resolved from extraction)
  profile: baseProfileSchema,

  // Industry-specific data
  industryExtension: z.record(z.string(), z.any()).optional(),

  // Metadata
  overallConfidence: z.number().min(0).max(1),
  needsManualReview: z.boolean(),
  extractionSources: z.array(extractionSourceSchema),
  createdAt: z.date().default(() => new Date()),

  // Field-level tracking
  fieldConfidences: z.record(z.string(), z.number()).optional(),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type BaseProfile = z.infer<typeof baseProfileSchema>;
export type ExtractionSource = z.infer<typeof extractionSourceSchema>;
export type FieldMetadata = z.infer<typeof fieldMetadataSchema>;
export type ExtractedProfile = z.infer<typeof extractedProfileSchema>;
export type TechStartupExtension = z.infer<typeof techStartupExtensionSchema>;
export type AgencyExtension = z.infer<typeof agencyExtensionSchema>;
export type CreativeExtension = z.infer<typeof creativeExtensionSchema>;
export type EcommerceExtension = z.infer<typeof ecommerceExtensionSchema>;
export type ProfileWithExtensions = z.infer<typeof profileWithExtensionsSchema>;
export type ProfileScaffold = z.infer<typeof profileScaffoldSchema>;
