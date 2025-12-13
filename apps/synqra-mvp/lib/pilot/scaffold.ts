import {
  type ExtractedProfile,
  type ProfileScaffold,
  type BaseProfile,
  type ExtractionSource,
  profileScaffoldSchema,
} from './schema';
import {
  calculateOverallConfidence,
  shouldTriggerManualFallback,
  validateExtractedProfile,
} from './validator';
import {
  normalizeExtractedProfile,
  extractBaseProfile,
  mergeExtractedProfiles,
  detectDuplicateData,
  detectInconsistencies,
} from './normalizer';

/**
 * ============================================================
 * SYNQRA PROFILE SCAFFOLD BUILDER
 * ============================================================
 * Build Profile Scaffold safely from validated data
 * Does NOT create user accounts - only prepares data structure
 */

// ============================================================
// SCAFFOLD BUILDING
// ============================================================

export function buildProfileScaffold(
  extracted: ExtractedProfile,
  industryExtension?: Record<string, any>
): ProfileScaffold {
  // Step 1: Normalize extracted data
  const normalized = normalizeExtractedProfile(extracted);

  // Step 2: Validate
  const validation = validateExtractedProfile(normalized);

  // Step 3: Calculate confidence
  const { score: overallConfidence, fieldScores } = calculateOverallConfidence(normalized);

  // Step 4: Check fallback requirements
  const fallback = shouldTriggerManualFallback(normalized);

  // Step 5: Extract base profile
  const profile = extractBaseProfile(normalized);

  // Step 6: Collect extraction sources
  const extractionSources = new Set<ExtractionSource>();
  for (const metadata of Object.values(normalized)) {
    if (metadata) {
      extractionSources.add(metadata.source);
    }
  }

  // Step 7: Build scaffold
  const scaffold: ProfileScaffold = {
    profile,
    industryExtension,
    overallConfidence,
    needsManualReview: fallback.required,
    extractionSources: Array.from(extractionSources),
    createdAt: new Date(),
    fieldConfidences: fieldScores,
  };

  // Step 8: Validate scaffold against schema
  return profileScaffoldSchema.parse(scaffold);
}

export function buildProfileScaffoldFromMultipleSources(
  extractedProfiles: ExtractedProfile[],
  industryExtension?: Record<string, any>
): ProfileScaffold {
  // Merge profiles using conflict resolution
  const merged = mergeExtractedProfiles(extractedProfiles);

  // Build scaffold from merged data
  return buildProfileScaffold(merged, industryExtension);
}

// ============================================================
// SCAFFOLD VALIDATION
// ============================================================

export function validateScaffold(
  scaffold: ProfileScaffold
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check critical fields
  if (!scaffold.profile.fullName) {
    errors.push('Missing required field: fullName');
  }

  if (!scaffold.profile.email) {
    errors.push('Missing required field: email');
  }

  // Check confidence threshold
  if (scaffold.overallConfidence < 0.4) {
    warnings.push(`Low overall confidence: ${(scaffold.overallConfidence * 100).toFixed(1)}%`);
  }

  // Check for data quality issues
  const duplicateCheck = detectDuplicateData(scaffold.profile);
  if (duplicateCheck.hasDuplicates) {
    warnings.push(...duplicateCheck.duplicates.map(d => `Duplicate data: ${d}`));
  }

  const inconsistencyCheck = detectInconsistencies(scaffold.profile);
  if (inconsistencyCheck.hasInconsistencies) {
    warnings.push(...inconsistencyCheck.inconsistencies.map(i => `Inconsistency: ${i}`));
  }

  // Check if manual review is needed
  if (scaffold.needsManualReview) {
    warnings.push('Manual review required');
  }

  const canProceed = errors.length === 0 && !scaffold.needsManualReview;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canProceed,
  };
}

// ============================================================
// SCAFFOLD ENRICHMENT
// ============================================================

export function enrichScaffoldWithManualData(
  scaffold: ProfileScaffold,
  manualData: Partial<BaseProfile>
): ProfileScaffold {
  // Merge manual data with higher precedence
  const enrichedProfile: BaseProfile = {
    ...scaffold.profile,
    ...manualData,
  };

  // Recalculate confidence (manual data has perfect confidence)
  const manualFields = Object.keys(manualData);
  const updatedFieldConfidences = { ...scaffold.fieldConfidences };

  for (const field of manualFields) {
    
  }

  // Recalculate overall confidence
  const totalFields = Object.keys(updatedFieldConfidences).length;
  const confidenceSum = Object.values(updatedFieldConfidences).reduce((a, b) => a + b, 0);
  const newOverallConfidence = totalFields > 0 ? confidenceSum / totalFields : 0;

  return {
    ...scaffold,
    profile: enrichedProfile,
    overallConfidence: newOverallConfidence,
    needsManualReview: newOverallConfidence < 0.4,
    fieldConfidences: updatedFieldConfidences,
    extractionSources: [...new Set([...scaffold.extractionSources, 'manual'])],
  };
}

// ============================================================
// SCAFFOLD EXPORT
// ============================================================

export function scaffoldToJSON(scaffold: ProfileScaffold): string {
  return JSON.stringify(scaffold, null, 2);
}

export function scaffoldFromJSON(json: string): ProfileScaffold {
  const parsed = JSON.parse(json);

  // Convert date strings back to Date objects
  if (parsed.createdAt) {
    parsed.createdAt = new Date(parsed.createdAt);
  }

  return profileScaffoldSchema.parse(parsed);
}

export function getScaffoldSummary(scaffold: ProfileScaffold): {
  completeness: number;
  confidence: number;
  readyForOnboarding: boolean;
  missingFields: string[];
  qualityScore: number;
} {
  const allPossibleFields = [
    'fullName',
    'email',
    'companyName',
    'role',
    'companySize',
    'linkedinProfile',
    'website',
    'industry',
    'whyPilot',
  ];

  const presentFields = Object.keys(scaffold.profile).filter(
    key => (scaffold.profile as any)[key] !== undefined && (scaffold.profile as any)[key] !== null
  );

  const missingFields = allPossibleFields.filter(
    field => !presentFields.includes(field)
  );

  const completeness = presentFields.length / allPossibleFields.length;
  const confidence = scaffold.overallConfidence;

  // Quality score combines completeness and confidence
  const qualityScore = (completeness * 0.4) + (confidence * 0.6);

  const readyForOnboarding =
    scaffold.profile.fullName !== undefined &&
    scaffold.profile.email !== undefined &&
    !scaffold.needsManualReview &&
    confidence >= 0.4;

  return {
    completeness,
    confidence,
    readyForOnboarding,
    missingFields,
    qualityScore,
  };
}
