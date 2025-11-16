/**
 * ============================================================
 * QUALITY VALIDATOR
 * ============================================================
 * Validates model output quality and determines if escalation needed
 * Uses cross-encoder scoring for semantic quality assessment
 */

import { QualityValidation } from "./types";

export interface QualityCheck {
  relevance: number; // How relevant is output to input? (0-1)
  coherence: number; // Is output coherent and well-formed? (0-1)
  brandConsistency: number; // Matches brand DNA? (0-1)
  toxicity: number; // Toxic content? (0-1, lower is better)
  accuracy: number; // Factually accurate? (0-1)
}

/**
 * Validate model output quality
 */
export async function validateQuality(
  input: string,
  output: string,
  modelId: string,
  requirements?: {
    minRelevance?: number;
    minCoherence?: number;
    minBrandConsistency?: number;
    maxToxicity?: number;
    requiresBrand?: boolean;
  }
): Promise<QualityValidation> {
  const defaults = {
    minRelevance: 0.7,
    minCoherence: 0.75,
    minBrandConsistency: 0.6,
    maxToxicity: 0.3,
    requiresBrand: false,
  };

  const config = { ...defaults, ...requirements };

  // Run quality checks
  const checks = await runQualityChecks(input, output, modelId);
  
  // Calculate overall score (weighted average)
  const weights = {
    relevance: 0.35,
    coherence: 0.25,
    brandConsistency: config.requiresBrand ? 0.25 : 0.1,
    toxicity: 0.15, // Inverted (lower is better)
    accuracy: 0.15,
  };

  const overallScore = 
    checks.relevance * weights.relevance +
    checks.coherence * weights.coherence +
    checks.brandConsistency * weights.brandConsistency +
    (1 - checks.toxicity) * weights.toxicity + // Invert toxicity
    checks.accuracy * weights.accuracy;

  // Determine issues
  const issues: string[] = [];
  if (checks.relevance < config.minRelevance) {
    issues.push(`Low relevance: ${(checks.relevance * 100).toFixed(1)}%`);
  }
  if (checks.coherence < config.minCoherence) {
    issues.push(`Low coherence: ${(checks.coherence * 100).toFixed(1)}%`);
  }
  if (checks.brandConsistency < config.minBrandConsistency && config.requiresBrand) {
    issues.push(`Brand mismatch: ${(checks.brandConsistency * 100).toFixed(1)}%`);
  }
  if (checks.toxicity > config.maxToxicity) {
    issues.push(`Toxicity detected: ${(checks.toxicity * 100).toFixed(1)}%`);
  }

  // Determine action
  let action: "deliver" | "rephrase" | "escalate";
  if (overallScore >= 0.8 && issues.length === 0) {
    action = "deliver";
  } else if (overallScore >= 0.6 && issues.length <= 2) {
    action = "rephrase";
  } else {
    action = "escalate";
  }

  // Generate suggestions
  const suggestions: string[] = [];
  if (action === "rephrase") {
    if (checks.relevance < 0.8) {
      suggestions.push("Focus more on the specific question asked");
    }
    if (checks.coherence < 0.8) {
      suggestions.push("Improve sentence structure and flow");
    }
    if (checks.brandConsistency < 0.7 && config.requiresBrand) {
      suggestions.push("Adjust tone to match brand voice");
    }
  }

  return {
    score: overallScore,
    passed: action === "deliver",
    action,
    issues,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Run individual quality checks
 */
async function runQualityChecks(
  input: string,
  output: string,
  modelId: string
): Promise<QualityCheck> {
  // Run checks in parallel for speed
  const [
    relevance,
    coherence,
    brandConsistency,
    toxicity,
    accuracy,
  ] = await Promise.all([
    checkRelevance(input, output),
    checkCoherence(output),
    checkBrandConsistency(output),
    checkToxicity(output),
    checkAccuracy(output, modelId),
  ]);

  return {
    relevance,
    coherence,
    brandConsistency,
    toxicity,
    accuracy,
  };
}

/**
 * Check relevance using semantic similarity
 */
async function checkRelevance(input: string, output: string): Promise<number> {
  // Use cross-encoder or embedding similarity
  // For now, simple heuristics
  
  // Extract key terms from input
  const inputTerms = extractKeyTerms(input);
  const outputLower = output.toLowerCase();
  
  // Count how many input terms appear in output
  const matches = inputTerms.filter(term => outputLower.includes(term.toLowerCase()));
  const relevanceScore = matches.length / Math.max(inputTerms.length, 1);
  
  // Boost if output is substantial (not too short)
  const lengthBonus = Math.min(output.length / 200, 1) * 0.2;
  
  return Math.min(relevanceScore + lengthBonus, 1);
}

/**
 * Check coherence (grammar, structure, readability)
 */
async function checkCoherence(output: string): Promise<number> {
  let score = 0.5; // Base score
  
  // Check for complete sentences
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    score += 0.15;
  }
  
  // Check for proper capitalization
  const hasCapitalization = /[A-Z]/.test(output);
  if (hasCapitalization) {
    score += 0.1;
  }
  
  // Check for reasonable length (not too short, not too long)
  const wordCount = output.split(/\s+/).length;
  if (wordCount >= 10 && wordCount <= 500) {
    score += 0.15;
  }
  
  // Check for varied sentence structure
  const avgSentenceLength = wordCount / sentences.length;
  if (avgSentenceLength >= 8 && avgSentenceLength <= 25) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

/**
 * Check brand consistency (RPRD DNA)
 */
async function checkBrandConsistency(output: string): Promise<number> {
  let score = 0.5; // Neutral baseline
  
  // RPRD DNA markers: clarity, precision, elegance
  const brandMarkers = {
    // Positive indicators
    positive: [
      'premium', 'executive', 'professional', 'luxury',
      'precision', 'clarity', 'elegant', 'sophisticated',
      'streamlined', 'optimized', 'intelligent', 'advanced'
    ],
    // Negative indicators (casual, hype, spam)
    negative: [
      'awesome!!!', 'amazing!!!', 'crazy', 'insane',
      'literally', 'honestly', 'basically', 'actually',
      'super duper', 'mega', 'omg', 'lol'
    ],
  };
  
  const outputLower = output.toLowerCase();
  
  // Check for positive brand markers
  const positiveCount = brandMarkers.positive.filter(marker => 
    outputLower.includes(marker)
  ).length;
  score += Math.min(positiveCount * 0.05, 0.3);
  
  // Penalize negative markers
  const negativeCount = brandMarkers.negative.filter(marker =>
    outputLower.includes(marker)
  ).length;
  score -= negativeCount * 0.15;
  
  // Check tone (should be confident but not aggressive)
  const exclamationCount = (output.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    score -= 0.1; // Too exclamatory
  }
  
  // Check for emoji usage (acceptable sparingly)
  const emojiCount = (output.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  if (emojiCount > 2) {
    score -= 0.15; // Too casual
  }
  
  return Math.max(Math.min(score, 1), 0);
}

/**
 * Check toxicity
 */
async function checkToxicity(output: string): Promise<number> {
  // Use RoBERTa toxicity model (when available)
  // For now, simple keyword-based check
  
  const toxicKeywords = [
    'hate', 'stupid', 'idiot', 'dumb', 'kill',
    'die', 'hell', 'damn', 'shit', 'fuck'
  ];
  
  const outputLower = output.toLowerCase();
  const toxicCount = toxicKeywords.filter(keyword =>
    outputLower.includes(keyword)
  ).length;
  
  // Return toxicity score (0 = clean, 1 = very toxic)
  return Math.min(toxicCount * 0.2, 1);
}

/**
 * Check factual accuracy (basic checks)
 */
async function checkAccuracy(output: string, modelId: string): Promise<number> {
  let score = 0.8; // Assume mostly accurate
  
  // Check for hallucination markers
  const hallucinationMarkers = [
    'I don\'t actually know',
    'I\'m not sure',
    'I cannot verify',
    'this might be incorrect',
    'please verify',
  ];
  
  const hasUncertainty = hallucinationMarkers.some(marker =>
    output.toLowerCase().includes(marker)
  );
  
  if (hasUncertainty) {
    score -= 0.2; // Honesty is good, but uncertainty reduces accuracy confidence
  }
  
  // Check for contradictions (very basic)
  const hasContradiction = 
    (output.includes('yes') && output.includes('no')) ||
    (output.includes('true') && output.includes('false')) ||
    (output.includes('can') && output.includes('cannot'));
  
  if (hasContradiction) {
    score -= 0.3;
  }
  
  return Math.max(score, 0);
}

/**
 * Extract key terms from text
 */
function extractKeyTerms(text: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
    'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could',
    'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 10); // Top 10 terms
}

/**
 * Quick quality check (fast, less thorough)
 */
export function quickQualityCheck(output: string): {
  isValid: boolean;
  score: number;
  reason?: string;
} {
  // Very fast checks for obvious issues
  
  if (output.length < 10) {
    return { isValid: false, score: 0.1, reason: "Output too short" };
  }
  
  if (output.length > 5000) {
    return { isValid: false, score: 0.3, reason: "Output too long" };
  }
  
  const toxicKeywords = ['hate', 'kill', 'die'];
  const hasToxic = toxicKeywords.some(k => output.toLowerCase().includes(k));
  if (hasToxic) {
    return { isValid: false, score: 0.2, reason: "Toxic content detected" };
  }
  
  // Basic coherence check
  const hasCapital = /[A-Z]/.test(output);
  const hasPunctuation = /[.!?]/.test(output);
  
  if (!hasCapital || !hasPunctuation) {
    return { isValid: false, score: 0.4, reason: "Lacks proper formatting" };
  }
  
  return { isValid: true, score: 0.75, reason: undefined };
}
