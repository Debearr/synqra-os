/**
 * ============================================================
 * SPAM & SAFETY FILTER
 * ============================================================
 * High-end spam detection and toxicity filtering
 * 
 * RPRD DNA: Protective, intelligent, precise
 */

import type { SpamType, ToxicityLevel } from "./types";

/**
 * Spam detection patterns
 */
const SPAM_PATTERNS = {
  promotional: [
    /\b(buy now|click here|limited time|act now|special offer)\b/i,
    /\b(sale|discount|coupon|promo code|deal)\b.*\b(ends|expires|today|now)\b/i,
    /\$\d+.*\b(off|discount|save)\b/i,
  ],

  scam: [
    /\b(free money|cash prize|you('ve| have) won|winner|claim your)\b/i,
    /\b(click.*link|visit.*site|check.*profile)\b/i,
    /\b(dm me|message me|contact me).*\b(opportunity|investment|business)\b/i,
    /\b(crypto|bitcoin|nft).*\b(giveaway|airdrop|free)\b/i,
  ],

  bot: [
    /^(first|nice|cool|wow|amazing|great)$/i, // Single generic word
    /^[\u{1F300}-\u{1F9FF}]{3,}$/u, // Only emojis (3+)
    /(.)\1{10,}/, // Repeated character spam
  ],

  link_spam: [
    /https?:\/\/[^\s]+/gi, // URLs
    /\b(www\.|\.com|\.net|\.org|\.io)\b/i,
    /\b[a-z0-9-]+\.(com|net|org|io|co)\b/i,
  ],

  duplicate: [], // Checked programmatically

  low_effort: [
    /^(lol|lmao|haha|lmfao|rofl)$/i,
    /^(first|second|third)!?$/i,
    /^[👍👎❤️🔥💯]{1,3}$/,
  ],
};

/**
 * Toxicity detection patterns
 */
const TOXICITY_PATTERNS = {
  mild: [
    /\b(stupid|dumb|idiot|moron|lame)\b/i,
    /\b(sucks|garbage|trash|terrible)\b/i,
    /\b(wtf|omg|ffs)\b/i,
  ],

  moderate: [
    /\b(f[*u]ck|sh[*i]t|damn|hell)\b/i,
    /\b(hate|despise|loathe)\b.*\b(you|this|it)\b/i,
    /\b(scam|fraud|ripoff|con)\b/i,
    /\b(worst|awful|disgusting)\b/i,
  ],

  severe: [
    /\b(kill|die|death|hurt|harm)\b/i,
    /\b(racist|sexist|bigot|nazi)\b/i,
    /\b(threat|threatening|violence)\b/i,
    /[🖕😠😡🤬]/g, // Offensive emojis
  ],

  extreme: [
    /\b(bomb|weapon|attack|terrorism)\b/i,
    /\b(illegal|crime|criminal activity)\b/i,
    /\b(suicide|self-harm)\b/i,
  ],
};

/**
 * Detect spam type
 */
export function detectSpamType(text: string): SpamType {
  for (const [type, patterns] of Object.entries(SPAM_PATTERNS)) {
    if (type === "duplicate") continue; // Handled separately

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type as SpamType;
      }
    }
  }

  return "none";
}

/**
 * Detect toxicity level
 */
export function detectToxicityLevel(text: string): ToxicityLevel {
  // Check extreme first (most severe)
  for (const pattern of TOXICITY_PATTERNS.extreme) {
    if (pattern.test(text)) {
      return "extreme";
    }
  }

  // Check severe
  for (const pattern of TOXICITY_PATTERNS.severe) {
    if (pattern.test(text)) {
      return "severe";
    }
  }

  // Check moderate
  for (const pattern of TOXICITY_PATTERNS.moderate) {
    if (pattern.test(text)) {
      return "moderate";
    }
  }

  // Check mild
  for (const pattern of TOXICITY_PATTERNS.mild) {
    if (pattern.test(text)) {
      return "mild";
    }
  }

  return "safe";
}

/**
 * Check if comment is duplicate (requires history)
 */
export function isDuplicate(
  text: string,
  authorId: string,
  recentComments: Array<{ text: string; authorId: string }>
): boolean {
  // Check last 100 comments for duplicates from same author
  const normalized = text.toLowerCase().trim();

  for (const comment of recentComments) {
    if (
      comment.authorId === authorId &&
      comment.text.toLowerCase().trim() === normalized
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate spam confidence (0-100)
 */
export function calculateSpamConfidence(spamType: SpamType, text: string): number {
  if (spamType === "none") return 0;

  let confidence = 50; // Base

  // Type-based confidence
  const typeConfidence: Record<SpamType, number> = {
    none: 0,
    promotional: 70,
    scam: 90,
    bot: 80,
    link_spam: 75,
    duplicate: 85,
    low_effort: 60,
  };

  confidence = typeConfidence[spamType] || 50;

  // Multiple spam indicators increase confidence
  let indicators = 0;
  for (const patterns of Object.values(SPAM_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        indicators++;
      }
    }
  }

  confidence += indicators * 5;

  return Math.min(100, confidence);
}

/**
 * Calculate toxicity confidence (0-100)
 */
export function calculateToxicityConfidence(
  toxicityLevel: ToxicityLevel,
  text: string
): number {
  if (toxicityLevel === "safe") return 0;

  let confidence = 50; // Base

  // Level-based confidence
  const levelConfidence: Record<ToxicityLevel, number> = {
    safe: 0,
    mild: 60,
    moderate: 75,
    severe: 90,
    extreme: 95,
  };

  confidence = levelConfidence[toxicityLevel] || 50;

  // Multiple toxicity indicators increase confidence
  let indicators = 0;
  for (const patterns of Object.values(TOXICITY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        indicators++;
      }
    }
  }

  confidence += indicators * 5;

  return Math.min(100, confidence);
}

/**
 * Determine if comment should be ignored
 */
export function shouldIgnore(
  spamType: SpamType,
  toxicityLevel: ToxicityLevel,
  spamConfidence: number,
  toxicityConfidence: number
): boolean {
  // Always ignore extreme toxicity
  if (toxicityLevel === "extreme") return true;

  // Always ignore high-confidence scams
  if (spamType === "scam" && spamConfidence >= 80) return true;

  // Ignore severe toxicity with high confidence
  if (toxicityLevel === "severe" && toxicityConfidence >= 70) return true;

  // Ignore any spam with very high confidence
  if (spamType !== "none" && spamConfidence >= 90) return true;

  return false;
}

/**
 * Get detected patterns (for logging/debugging)
 */
export function getDetectedPatterns(text: string): string[] {
  const patterns: string[] = [];

  // Check spam patterns
  for (const [type, typePatterns] of Object.entries(SPAM_PATTERNS)) {
    for (const pattern of typePatterns) {
      if (pattern.test(text)) {
        patterns.push(`spam:${type}`);
        break; // Only count once per type
      }
    }
  }

  // Check toxicity patterns
  for (const [level, levelPatterns] of Object.entries(TOXICITY_PATTERNS)) {
    for (const pattern of levelPatterns) {
      if (pattern.test(text)) {
        patterns.push(`toxicity:${level}`);
        break; // Only count once per level
      }
    }
  }

  // Check other indicators
  if (text.length < 10) patterns.push("short_text");
  if (text.length > 500) patterns.push("long_text");
  if (/[!?]{3,}/.test(text)) patterns.push("excessive_punctuation");
  if (/[A-Z]{10,}/.test(text)) patterns.push("excessive_caps");
  if (/(.)\1{5,}/.test(text)) patterns.push("repeated_characters");

  return patterns;
}
