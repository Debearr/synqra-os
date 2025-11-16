/**
 * ============================================================
 * SMART PROMPT SUGGESTION SYSTEM
 * ============================================================
 * Analyze user's initial idea and improve clarity without spam
 * Convert messy inputs into clear creative briefs
 * 
 * RULES:
 * - Only suggest when genuinely helpful
 * - Keep suggestions concise (2-3 lines max)
 * - Use lightweight models to minimize cost
 * - Never degrade output quality
 * 
 * RPRD DNA: Intelligent, helpful, not intrusive
 */

import type { Platform } from "./platform-specs";
import { PLATFORM_SPECS } from "./platform-specs";

export type PromptQuality =
  | "excellent" // Clear, specific, actionable
  | "good" // Mostly clear, minor improvements possible
  | "needs_work" // Vague or missing key details
  | "poor"; // Too vague or confusing

export type PromptAnalysis = {
  quality: PromptQuality;
  clarity: number; // 0-100
  specificity: number; // 0-100
  actionability: number; // 0-100
  issues: string[];
  suggestions: string[];
  improvedPrompt?: string;
};

/**
 * Analyze prompt quality (rules-based, zero cost)
 */
export function analyzePrompt(
  prompt: string,
  platform: Platform
): PromptAnalysis {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let clarity = 100;
  let specificity = 100;
  let actionability = 100;

  // Check length
  if (prompt.length < 10) {
    issues.push("Prompt too short");
    suggestions.push("Add more details about what you want to create");
    clarity -= 40;
    specificity -= 40;
  }

  if (prompt.length > 500) {
    issues.push("Prompt too long");
    suggestions.push(
      "Simplify your prompt—focus on the core visual concept"
    );
    clarity -= 20;
  }

  // Check for vague words
  const vagueWords = [
    "something",
    "anything",
    "whatever",
    "maybe",
    "perhaps",
    "kinda",
    "sorta",
  ];
  const hasVagueWords = vagueWords.some((word) =>
    prompt.toLowerCase().includes(word)
  );

  if (hasVagueWords) {
    issues.push("Contains vague language");
    suggestions.push("Be specific: what exactly do you want to show?");
    specificity -= 30;
  }

  // Check for specificity markers
  const specificityMarkers = [
    "bold",
    "minimalist",
    "dark",
    "bright",
    "professional",
    "casual",
    "luxury",
    "modern",
    "vintage",
  ];
  const hasSpecificity = specificityMarkers.some((marker) =>
    prompt.toLowerCase().includes(marker)
  );

  if (!hasSpecificity) {
    issues.push("Missing visual style description");
    suggestions.push(
      "Add style keywords: minimalist, bold, dark, professional, etc."
    );
    specificity -= 25;
  }

  // Check for color mentions
  const hasMentionedColors =
    /color|#[0-9a-f]{6}|rgb|red|blue|green|yellow|black|white|gray/i.test(
      prompt
    );

  if (!hasMentionedColors) {
    issues.push("No color guidance");
    specificity -= 15;
  }

  // Check for platform awareness
  const platformName = PLATFORM_SPECS[platform].displayName;
  const mentionsPlatform = prompt.toLowerCase().includes(platformName.toLowerCase());

  if (!mentionsPlatform) {
    suggestions.push(
      `Remember: this is for ${platformName} (${PLATFORM_SPECS[platform].aspectRatio})`
    );
    actionability -= 10;
  }

  // Check for text content specification
  const mentionsText = /text|title|headline|caption|quote/i.test(prompt);

  if (!mentionsText) {
    suggestions.push(
      "Specify what text should appear (if any): title, headline, quote, etc."
    );
    actionability -= 15;
  }

  // Determine overall quality
  const avgScore = (clarity + specificity + actionability) / 3;
  let quality: PromptQuality;

  if (avgScore >= 85) quality = "excellent";
  else if (avgScore >= 70) quality = "good";
  else if (avgScore >= 50) quality = "needs_work";
  else quality = "poor";

  return {
    quality,
    clarity: Math.max(0, clarity),
    specificity: Math.max(0, specificity),
    actionability: Math.max(0, actionability),
    issues,
    suggestions: suggestions.slice(0, 3), // Max 3 suggestions
  };
}

/**
 * Generate improved prompt (lightweight model, minimal tokens)
 */
export async function improvePrompt(
  originalPrompt: string,
  platform: Platform,
  analysis: PromptAnalysis
): Promise<string> {
  if (analysis.quality === "excellent") {
    return originalPrompt; // No improvement needed
  }

  // For now, use rules-based improvement (zero cost)
  // In production, this would call a cheap model if needed

  const platformSpec = PLATFORM_SPECS[platform];
  const improvements: string[] = [originalPrompt];

  // Add platform context if missing
  if (!originalPrompt.toLowerCase().includes(platformSpec.displayName.toLowerCase())) {
    improvements.push(
      `Optimized for ${platformSpec.displayName} (${platformSpec.aspectRatio})`
    );
  }

  // Add creative guidelines if prompt is vague
  if (analysis.quality === "poor" || analysis.quality === "needs_work") {
    improvements.push(platformSpec.creativeGuidelines.visualStyle);
  }

  return improvements.join(". ");
}

/**
 * Get contextual tips based on platform (Chris Do style)
 */
export function getStrategicTips(platform: Platform): string[] {
  const platformSpec = PLATFORM_SPECS[platform];

  const tips = [
    `${platformSpec.displayName} thumbnails perform best with ${platformSpec.creativeGuidelines.visualStyle.toLowerCase()}`,
    ...platformSpec.creativeGuidelines.keyOptimizations.slice(0, 2),
  ];

  // Add platform-specific strategy
  if (platform === "youtube") {
    tips.push(
      "Thumbnails are viewed at ~200px wide—make sure your focal point is clear at small size"
    );
  } else if (platform === "linkedin") {
    tips.push(
      "LinkedIn audiences respond to professional clarity—avoid busy designs"
    );
  } else if (platform === "tiktok" || platform === "instagram_reel") {
    tips.push(
      "Vertical platforms need strong center-frame energy—avoid edges"
    );
  } else if (platform === "instagram_feed") {
    tips.push(
      "Instagram users save posts that fit their aesthetic—make it cohesive"
    );
  }

  return tips.slice(0, 3); // Max 3 tips
}

/**
 * Detect missing information and ask clarifying questions
 */
export function getClarifyingQuestions(
  prompt: string,
  platform: Platform
): string[] {
  const questions: string[] = [];

  // Check what's missing
  if (!/text|title|headline/i.test(prompt)) {
    questions.push("What text should appear on the thumbnail?");
  }

  if (!/color|palette|scheme/i.test(prompt)) {
    questions.push("What color scheme matches your brand?");
  }

  if (!/style|mood|feel|vibe/i.test(prompt)) {
    questions.push("What visual style are you aiming for? (minimal, bold, luxury, etc.)");
  }

  if (platform === "youtube" && !/face|person|portrait/i.test(prompt)) {
    questions.push("Should the thumbnail include a face or portrait? (Faces increase click-through)");
  }

  return questions.slice(0, 2); // Max 2 questions
}

/**
 * Suggest prompt templates based on use case
 */
export function getPromptTemplates(platform: Platform): Array<{
  name: string;
  template: string;
  useCase: string;
}> {
  const platformName = PLATFORM_SPECS[platform].displayName;

  return [
    {
      name: "Bold Announcement",
      template: `Bold, high-contrast ${platformName} thumbnail with [HEADLINE TEXT] in large, readable font. Background: [COLOR]. Include [VISUAL ELEMENT]. Style: professional, eye-catching.`,
      useCase: "Product launches, announcements, news",
    },
    {
      name: "Minimalist Thought Leadership",
      template: `Clean, minimalist ${platformName} design. Quote: "[YOUR QUOTE]". Typography-focused. Color palette: [COLORS]. No clutter. Professional.`,
      useCase: "Quotes, insights, LinkedIn posts",
    },
    {
      name: "High-Energy Social",
      template: `Vibrant, energetic ${platformName} thumbnail. Central focus: [SUBJECT]. Bold colors: [COLORS]. Fast-read text: "[HEADLINE]". Mobile-optimized.`,
      useCase: "TikTok, Reels, Stories",
    },
    {
      name: "Tutorial/How-To",
      template: `${platformName} tutorial thumbnail. Clear focal point: [TOOL/SUBJECT]. Title: "[HOW TO ___]". Step number visible. Professional, educational style.`,
      useCase: "Tutorials, explainers, how-to content",
    },
  ];
}

/**
 * Auto-complete partial prompts
 */
export function autoCompletePrompt(
  partialPrompt: string,
  platform: Platform
): string[] {
  const completions: string[] = [];

  // Detect intent from partial prompt
  if (/launch|announce|new/i.test(partialPrompt)) {
    completions.push(
      `${partialPrompt} with bold typography and high contrast for maximum visibility`
    );
    completions.push(
      `${partialPrompt} in minimalist style with clear focal point`
    );
  } else if (/quote|insight|thought/i.test(partialPrompt)) {
    completions.push(
      `${partialPrompt} with clean typography on solid background`
    );
    completions.push(
      `${partialPrompt} in luxury editorial style`
    );
  } else if (/tutorial|how to|guide/i.test(partialPrompt)) {
    completions.push(
      `${partialPrompt} with step number and clear visual example`
    );
    completions.push(
      `${partialPrompt} with before/after comparison`
    );
  } else {
    // Generic completions
    completions.push(
      `${partialPrompt} with bold, eye-catching design`
    );
    completions.push(
      `${partialPrompt} in minimalist professional style`
    );
  }

  return completions.slice(0, 3);
}
