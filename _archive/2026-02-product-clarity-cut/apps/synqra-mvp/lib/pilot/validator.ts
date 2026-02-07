import { z } from 'zod';
import {
  baseProfileSchema,
  type ExtractedProfile,
  type FieldMetadata,
  type ExtractionSource,
} from './schema';

/**
 * ============================================================
 * SYNQRA ONBOARDING VALIDATOR
 * ============================================================
 * Confidence scoring, field validation, and fallback rules
 */

// ============================================================
// CONSTANTS
// ============================================================

const MANUAL_REVIEW_THRESHOLD = 0.4;

const SOURCE_PRECEDENCE: Record<ExtractionSource, number> = {
  url: 3,        // Highest - direct from LinkedIn/website
  document: 2,   // Medium - uploaded resume/profile
  image: 1,      // Lowest - OCR extraction
  manual: 4,     // Always wins (user input)
};

const FIELD_WEIGHTS: Record<string, number> = {
  fullName: 1.5,
  email: 2.0,      // Critical field
  companyName: 1.2,
  role: 1.0,
  companySize: 0.8,
  linkedinProfile: 1.0,
  website: 0.8,
  industry: 1.0,
  whyPilot: 0.5,   // Often manually filled
};

// ============================================================
// CONFIDENCE SCORING
// ============================================================

export function calculateFieldConfidence(metadata: FieldMetadata): number {
  let confidence = metadata.confidence;

  // Source-based adjustment
  if (metadata.source === 'url') {
    confidence = Math.min(1.0, confidence * 1.2); // URL extractions more reliable
  } else if (metadata.source === 'image') {
    confidence = confidence * 0.8; // OCR less reliable
  }

  // Validation-based adjustment
  const isValid = validateFieldValue(metadata.value);
  if (!isValid) {
    confidence = confidence * 0.5; // Penalize invalid data
  }

  return Math.max(0, Math.min(1, confidence));
}

export function calculateOverallConfidence(
  extracted: ExtractedProfile
): { score: number; fieldScores: Record<string, number> } {
  const fields = Object.keys(extracted) as Array<keyof ExtractedProfile>;
  const fieldScores: Record<string, number> = {};

  let weightedSum = 0;
  let totalWeight = 0;

  for (const field of fields) {
    const metadata = extracted[field];
    if (!metadata) continue;

    const fieldConfidence = calculateFieldConfidence(metadata);
    const weight = FIELD_WEIGHTS[field] || 1.0;

    fieldScores[field] = fieldConfidence;
    weightedSum += fieldConfidence * weight;
    totalWeight += weight;
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return { score, fieldScores };
}

// ============================================================
// FIELD VALIDATION
// ============================================================

function validateFieldValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  // Basic type checks
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

export function validateExtractedField(
  fieldName: keyof ExtractedProfile,
  metadata: FieldMetadata
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check confidence threshold
  if (metadata.confidence < 0.3) {
    errors.push(`Low confidence (${metadata.confidence.toFixed(2)})`);
  }

  // Field-specific validation
  try {
    const fieldSchema = (baseProfileSchema.shape as Record<string, z.ZodTypeAny>)[fieldName as string];
    if (fieldSchema) {
      fieldSchema.parse(metadata.value);
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      errors.push(...e.errors.map(err => err.message));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateExtractedProfile(
  extracted: ExtractedProfile
): {
  valid: boolean;
  fieldValidations: Record<string, { valid: boolean; errors: string[] }>;
  overallConfidence: number;
  needsManualReview: boolean;
} {
  const fieldValidations: Record<string, { valid: boolean; errors: string[] }> = {};
  const fields = Object.keys(extracted) as Array<keyof ExtractedProfile>;

  for (const field of fields) {
    const metadata = extracted[field];
    if (metadata) {
      fieldValidations[field] = validateExtractedField(field, metadata);
    }
  }

  const { score: overallConfidence } = calculateOverallConfidence(extracted);
  const needsManualReview = overallConfidence < MANUAL_REVIEW_THRESHOLD;

  const allFieldsValid = Object.values(fieldValidations).every(v => v.valid);

  return {
    valid: allFieldsValid && !needsManualReview,
    fieldValidations,
    overallConfidence,
    needsManualReview,
  };
}

// ============================================================
// FALLBACK RULES
// ============================================================

export function shouldTriggerManualFallback(
  extracted: ExtractedProfile
): {
  required: boolean;
  reason: string;
  missingCriticalFields: string[];
} {
  const { score: overallConfidence } = calculateOverallConfidence(extracted);

  // Check overall confidence
  if (overallConfidence < MANUAL_REVIEW_THRESHOLD) {
    return {
      required: true,
      reason: `Overall confidence ${(overallConfidence * 100).toFixed(1)}% below threshold (40%)`,
      missingCriticalFields: [],
    };
  }

  // Check critical fields
  const criticalFields: Array<keyof ExtractedProfile> = ['fullName', 'email'];
  const missingCriticalFields: string[] = [];

  for (const field of criticalFields) {
    const metadata = extracted[field];
    if (!metadata || metadata.confidence < 0.5) {
      missingCriticalFields.push(field);
    }
  }

  if (missingCriticalFields.length > 0) {
    return {
      required: true,
      reason: 'Missing or low-confidence critical fields',
      missingCriticalFields,
    };
  }

  return {
    required: false,
    reason: '',
    missingCriticalFields: [],
  };
}

export function getFieldRequirements(): {
  required: string[];
  optional: string[];
  critical: string[];
} {
  return {
    required: ['fullName', 'email'],
    optional: ['companyName', 'role', 'companySize', 'linkedinProfile', 'website', 'industry'],
    critical: ['fullName', 'email'],
  };
}

// ============================================================
// SOURCE PRECEDENCE
// ============================================================

export function getHigherPrecedenceSource(
  source1: ExtractionSource,
  source2: ExtractionSource
): ExtractionSource {
  return SOURCE_PRECEDENCE[source1] > SOURCE_PRECEDENCE[source2] ? source1 : source2;
}

export function compareSourcePrecedence(
  source1: ExtractionSource,
  source2: ExtractionSource
): number {
  return SOURCE_PRECEDENCE[source1] - SOURCE_PRECEDENCE[source2];
}
