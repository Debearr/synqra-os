import {
  type ExtractedProfile,
  type FieldMetadata,
  type BaseProfile,
  type ExtractionSource,
} from './schema';
import { getHigherPrecedenceSource } from './validator';

/**
 * ============================================================
 * SYNQRA ONBOARDING NORMALIZER
 * ============================================================
 * Clean incoming extracted values and resolve multi-source conflicts
 */

// ============================================================
// VALUE CLEANING
// ============================================================

export function cleanString(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[^\S\r\n]+/g, ' ');   // Remove extra spaces
}

export function cleanEmail(value: string): string {
  return value.toLowerCase().trim();
}

export function cleanUrl(value: string): string {
  let url = value.trim();

  // Add protocol if missing
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  return url;
}

export function cleanLinkedInUrl(value: string): string {
  let url = cleanUrl(value);

  // Normalize LinkedIn URLs
  url = url.replace(/www\.linkedin\.com/i, 'linkedin.com');
  url = url.replace(/linkedin\.com\/in\/([^\/]+).*/, 'linkedin.com/in/$1');

  return url;
}

export function normalizeFieldValue(
  fieldName: string,
  value: any
): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  // Field-specific normalization
  switch (fieldName) {
    case 'email':
      return cleanEmail(value);

    case 'linkedinProfile':
      return cleanLinkedInUrl(value);

    case 'website':
      return cleanUrl(value);

    case 'fullName':
    case 'companyName':
    case 'role':
    case 'industry':
      return cleanString(value);

    default:
      return cleanString(value);
  }
}

// ============================================================
// CONFLICT RESOLUTION
// ============================================================

export function resolveFieldConflict(
  field1: FieldMetadata,
  field2: FieldMetadata
): FieldMetadata {
  // Rule 1: Source precedence (URL > document > image)
  const sourcePrecedence = getHigherPrecedenceSource(field1.source, field2.source);
  if (field1.source === sourcePrecedence && field1.source !== field2.source) {
    return field1;
  }
  if (field2.source === sourcePrecedence && field1.source !== field2.source) {
    return field2;
  }

  // Rule 2: Higher confidence wins (if same source)
  if (field1.confidence > field2.confidence) {
    return field1;
  }
  if (field2.confidence > field1.confidence) {
    return field2;
  }

  // Rule 3: More recent extraction wins
  if (field1.extractedAt > field2.extractedAt) {
    return field1;
  }

  return field2;
}

export function mergeExtractedProfiles(
  profiles: ExtractedProfile[]
): ExtractedProfile {
  if (profiles.length === 0) {
    return {};
  }

  if (profiles.length === 1) {
    return profiles[0];
  }

  const merged: ExtractedProfile = {};
  const allFields = new Set<string>();

  // Collect all field names
  for (const profile of profiles) {
    Object.keys(profile).forEach(field => allFields.add(field));
  }

  // Resolve conflicts for each field
  for (const field of allFields) {
    const candidates = profiles
      .map(p => (p as any)[field])
      .filter((metadata): metadata is FieldMetadata => metadata !== undefined);

    if (candidates.length === 0) continue;

    // Resolve multiple candidates
    let winner = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      winner = resolveFieldConflict(winner, candidates[i]);
    }

    (merged as any)[field] = winner;
  }

  return merged;
}

// ============================================================
// PROFILE NORMALIZATION
// ============================================================

export function normalizeExtractedProfile(
  extracted: ExtractedProfile
): ExtractedProfile {
  const normalized: ExtractedProfile = {};

  for (const [fieldName, metadata] of Object.entries(extracted)) {
    if (!metadata) continue;

    const normalizedValue = normalizeFieldValue(fieldName, metadata.value);

    normalized[fieldName as keyof ExtractedProfile] = {
      ...metadata,
      value: normalizedValue,
    };
  }

  return normalized;
}

export function extractBaseProfile(
  extracted: ExtractedProfile
): BaseProfile {
  const base: BaseProfile = {};

  for (const [fieldName, metadata] of Object.entries(extracted)) {
    if (metadata && metadata.value !== null && metadata.value !== undefined) {
      (base as any)[fieldName] = metadata.value;
    }
  }

  return base;
}

// ============================================================
// DATA QUALITY CHECKS
// ============================================================

export function detectDuplicateData(
  profile: BaseProfile
): { hasDuplicates: boolean; duplicates: string[] } {
  const duplicates: string[] = [];

  // Check for common duplicate patterns
  if (profile.fullName && profile.companyName) {
    if (profile.fullName.toLowerCase() === profile.companyName.toLowerCase()) {
      duplicates.push('fullName matches companyName');
    }
  }

  if (profile.email && profile.linkedinProfile) {
    const emailUsername = profile.email.split('@')[0];
    if (profile.linkedinProfile.includes(emailUsername)) {
      // This is often expected, not a duplicate
    }
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

export function detectInconsistencies(
  profile: BaseProfile
): { hasInconsistencies: boolean; inconsistencies: string[] } {
  const inconsistencies: string[] = [];

  // Check LinkedIn URL matches
  if (profile.linkedinProfile && profile.fullName) {
    const urlName = profile.linkedinProfile
      .split('/in/')[1]
      ?.split('-')
      .join(' ');

    if (urlName) {
      const nameLower = profile.fullName.toLowerCase();
      const urlNameLower = urlName.toLowerCase();

      // Simple fuzzy check
      if (!nameLower.includes(urlNameLower.split(' ')[0])) {
        inconsistencies.push('LinkedIn URL may not match full name');
      }
    }
  }

  // Check email domain vs website
  if (profile.email && profile.website) {
    const emailDomain = profile.email.split('@')[1];
    const websiteDomain = profile.website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    if (emailDomain !== websiteDomain) {
      // This is common (personal email vs company site), not necessarily an error
    }
  }

  return {
    hasInconsistencies: inconsistencies.length > 0,
    inconsistencies,
  };
}
