/**
 * ============================================================
 * RPRD DNA PATTERNS - NØID LABS
 * ============================================================
 * Rules • Protocols • Refinements • Directives
 * 
 * Core patterns for consistent, cost-efficient, premium output
 * across the entire NØID ecosystem.
 */

import { aiClient } from "../ai/client";
import type { AIResponse, MultiVersionResponse } from "../ai/client";

// ============================================================
// TYPES
// ============================================================

export type OutputMode = "prototype" | "polished";
export type ContentType = "email" | "social" | "script" | "copy" | "campaign";

export interface RPRDRequest {
  content: string;
  type?: ContentType;
  mode?: OutputMode;
  multiVersion?: boolean;
  refinePass?: boolean;
}

export interface RPRDOutput {
  primary: string;
  alternatives?: string[];
  refined?: string;
  metadata: {
    mode: OutputMode;
    versionsGenerated: number;
    refinePassed: boolean;
    model: string;
    tier: string;
  };
}

// ============================================================
// BRAND VOICE CONSTANTS
// ============================================================

export const BRAND_VOICE = {
  core: [
    "Premium",
    "Cinematic",
    "Clean",
    "Luxury street × quiet luxury",
    "No AI slop",
    "No generic marketing fluff",
    "Simple, understandable English",
  ],
  forbidden: [
    "Leverage",
    "Synergy",
    "Ecosystem" (unless referring to literal NØID ecosystem),
    "Revolutionary",
    "Game-changing",
    "Next-level",
    "Cutting-edge" (overused),
  ],
  preferred: [
    "Precise",
    "Strategic",
    "Executive",
    "Deliberate",
    "Motion-smooth",
    "Concierge-grade",
  ],
} as const;

// ============================================================
// SYSTEM PROMPTS
// ============================================================

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  email: `You are a premium communication specialist for NØID Labs. Write emails that are:
- Executive-ready and concise
- Clear and direct (no fluff)
- Premium tone without being pretentious
- Action-oriented but never pushy

Brand DNA: ${BRAND_VOICE.core.join(", ")}
Avoid: ${BRAND_VOICE.forbidden.join(", ")}`,

  social: `You are a social media strategist for NØID Labs (Synqra, NØID, AuraFX). Create content that is:
- Platform-native and engaging
- Premium but accessible
- Strategic storytelling
- Brand-consistent across all channels

Brand DNA: ${BRAND_VOICE.core.join(", ")}
Tone: Luxury street meets quiet luxury`,

  script: `You are a creative director for NØID Labs. Write scripts that are:
- Cinematic and compelling
- Clear narrative arc
- Premium production value
- Emotionally resonant without being manipulative

Visual language: Clean, matte, precise`,

  copy: `You are a copywriter for NØID Labs. Create copy that is:
- Tight and purposeful
- Premium positioning
- Clear value proposition
- No marketing fluff or buzzwords

Every word must earn its place.`,

  campaign: `You are a campaign strategist for NØID Labs. Design campaigns that are:
- Multi-channel and cohesive
- Strategic from start to finish
- Premium execution
- Measurable and deliberate

Campaigns should feel like luxury products themselves.`,
};

// ============================================================
// CORE RPRD FUNCTIONS
// ============================================================

/**
 * Generate content with RPRD DNA patterns applied
 */
export async function generateWithRPRD(request: RPRDRequest): Promise<RPRDOutput> {
  const mode = request.mode || "polished";
  const type = request.type || "copy";
  const systemPrompt = SYSTEM_PROMPTS[type];

  let primary: string;
  let alternatives: string[] = [];
  let refined: string | undefined;
  let model = "unknown";
  let tier = "unknown";

  // Step 1: Generate primary version (or multi-version if requested)
  if (request.multiVersion) {
    const multiResult: MultiVersionResponse = await aiClient.generateMultiVersion({
      prompt: request.content,
      systemPrompt,
      taskType: type === "script" || type === "campaign" ? "creative" : "strategic",
      mode,
      versions: 2,
    });

    primary = multiResult.versions[0].content;
    alternatives = multiResult.versions.slice(1).map((v) => v.content);
    model = multiResult.versions[0].model;
    tier = multiResult.versions[0].tier;
  } else {
    const result: AIResponse = await aiClient.generate({
      prompt: request.content,
      systemPrompt,
      taskType: type === "script" || type === "campaign" ? "creative" : "strategic",
      mode,
    });

    primary = result.content;
    model = result.model;
    tier = result.tier;
  }

  // Step 2: Apply refine pass if requested (cheaper model)
  if (request.refinePass) {
    const refineResult = await aiClient.refine(
      primary,
      `Tighten this for premium brand voice. Keep meaning intact. Remove any fluff. Brand DNA: ${BRAND_VOICE.core.join(", ")}`
    );
    refined = refineResult.content;
  }

  return {
    primary,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    refined,
    metadata: {
      mode,
      versionsGenerated: alternatives.length + 1,
      refinePassed: !!refined,
      model,
      tier,
    },
  };
}

/**
 * Multi-version helper: Generate A/B variants
 */
export async function generateABVariants(
  prompt: string,
  type?: ContentType
): Promise<{ variantA: string; variantB: string; metadata: any }> {
  const result = await generateWithRPRD({
    content: prompt,
    type,
    multiVersion: true,
    mode: "polished",
  });

  return {
    variantA: result.primary,
    variantB: result.alternatives?.[0] || result.primary,
    metadata: result.metadata,
  };
}

/**
 * Quick refine helper
 */
export async function quickRefine(content: string, type?: ContentType): Promise<string> {
  const systemPrompt = type ? SYSTEM_PROMPTS[type] : undefined;
  const result = await aiClient.refine(content, systemPrompt);
  return result.content;
}

/**
 * Prototype mode: Fast, lighter output for iteration
 */
export async function generatePrototype(
  prompt: string,
  type?: ContentType
): Promise<string> {
  const result = await generateWithRPRD({
    content: prompt,
    type,
    mode: "prototype",
    multiVersion: false,
    refinePass: false,
  });

  return result.primary;
}

/**
 * Polished mode: Full premium output
 */
export async function generatePolished(
  prompt: string,
  type?: ContentType,
  withRefine: boolean = true
): Promise<string> {
  const result = await generateWithRPRD({
    content: prompt,
    type,
    mode: "polished",
    multiVersion: false,
    refinePass: withRefine,
  });

  return result.refined || result.primary;
}

// ============================================================
// BRAND VOICE VALIDATOR
// ============================================================

/**
 * Check if content adheres to brand voice guidelines
 * (Simple rule-based check, no AI cost)
 */
export function validateBrandVoice(content: string): {
  passed: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const lowerContent = content.toLowerCase();

  // Check for forbidden words
  for (const forbidden of BRAND_VOICE.forbidden) {
    if (lowerContent.includes(forbidden.toLowerCase())) {
      issues.push(`Contains forbidden word: "${forbidden}"`);
    }
  }

  // Check for excessive exclamation marks
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    issues.push("Too many exclamation marks (keep it subtle)");
    suggestions.push("Use periods or em dashes for emphasis instead");
  }

  // Check for ALL CAPS (except short acronyms)
  const allCapsWords = content.match(/\b[A-Z]{4,}\b/g) || [];
  if (allCapsWords.length > 0) {
    issues.push("Contains all-caps words (not premium)");
    suggestions.push("Use proper case with strategic emphasis");
  }

  // Check for emojis (should be minimal and strategic)
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 3) {
    issues.push("Too many emojis");
    suggestions.push("Use emojis sparingly for strategic impact");
  }

  return {
    passed: issues.length === 0,
    issues,
    suggestions,
  };
}
