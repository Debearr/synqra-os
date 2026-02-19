/**
 * ============================================================
 * REPLY GENERATOR
 * ============================================================
 * Generates context-aware replies in De Bear's tone
 * 
 * RPRD DNA: Premium, authentic, helpful
 */

import type { CommentSource, Intent, Sentiment, CommenterType, GeneratedReply, ReplyStyle } from "./types";
import { getOpener, getCloser, validateTone, DE_BEAR_TONE } from "./tone-engine";
import { aiClient } from "../ai/client";

/**
 * Generate reply using AI with De Bear tone enforcement
 */
export async function generateReply(
  comment: CommentSource,
  intent: Intent,
  sentiment: Sentiment,
  commenterType: CommenterType,
  productFit: string,
  conversionPotential: number
): Promise<GeneratedReply> {
  // Determine reply style based on context
  const style = determineReplyStyle(intent, sentiment, commenterType);

  // Build context-aware prompt
  const prompt = buildReplyPrompt(comment, intent, sentiment, commenterType, productFit, style);

  // Generate reply using AI
  const response = await aiClient.generateCreative({
    prompt,
    maxTokens: 200,
    temperature: 0.7,
    model: "mid", // Mid-tier model for cost efficiency
  });

  let replyText = response.content.trim();

  // Validate tone compliance
  const toneValidation = validateTone(replyText);

  // If tone is weak, regenerate with stricter prompt
  if (!toneValidation.compliant) {
    console.warn("[REPLY GENERATOR] Tone validation failed, regenerating...");
    
    const stricterPrompt = `${prompt}\n\nIMPORTANT: Be direct, witty, and premium. NO corporate jargon. NO exclamation marks. NO "Thank you for..." or "Feel free to...". Use De Bear's voice.`;
    
    const retryResponse = await aiClient.generateCreative({
      prompt: stricterPrompt,
      maxTokens: 200,
      temperature: 0.6, // Slightly lower for more control
      model: "mid",
    });

    replyText = retryResponse.content.trim();
  }

  // Determine if CTA should be included
  const includeCTA = shouldIncludeCTA(intent, commenterType, conversionPotential);
  const ctaType = includeCTA ? determineCTAType(intent, productFit) : undefined;

  // Add CTA if appropriate
  if (includeCTA && ctaType) {
    replyText = addCTA(replyText, ctaType, productFit);
  }

  // Final validation
  const finalValidation = validateTone(replyText);

  return {
    text: replyText,
    style,
    tone: determineTone(commenterType, sentiment),
    includesCTA: includeCTA,
    ctaType,
    confidence: finalValidation.score,
    alternativeReplies: [], // Could generate A/B variants
  };
}

/**
 * Determine reply style based on context
 */
function determineReplyStyle(
  intent: Intent,
  sentiment: Sentiment,
  commenterType: CommenterType
): ReplyStyle {
  // High-value leads get strategic responses
  if (commenterType === "high_value_lead" || intent === "buying_signal") {
    return "strategic";
  }

  // Complaints get empathetic responses
  if (intent === "complaint" || sentiment === "negative") {
    return "empathetic";
  }

  // Questions get helpful responses
  if (intent === "question" || intent === "request_help") {
    return "helpful";
  }

  // Casual comments get brief responses
  if (intent === "casual" || intent === "praise") {
    return "brief";
  }

  // Default: witty (De Bear's natural style)
  return "witty";
}

/**
 * Determine tone based on commenter and sentiment
 */
function determineTone(
  commenterType: CommenterType,
  sentiment: Sentiment
): "premium" | "casual" | "professional" {
  // High-value leads always get premium tone
  if (commenterType === "high_value_lead") {
    return "premium";
  }

  // Current users get casual (friendly) tone
  if (commenterType === "current_user") {
    return "casual";
  }

  // Negative sentiment gets professional tone
  if (sentiment === "negative") {
    return "professional";
  }

  // Default: premium
  return "premium";
}

/**
 * Build AI prompt for reply generation
 */
function buildReplyPrompt(
  comment: CommentSource,
  intent: Intent,
  sentiment: Sentiment,
  commenterType: CommenterType,
  productFit: string,
  style: ReplyStyle
): string {
  const opener = getOpener(intent);
  const closer = getCloser(style);

  return `You are De Bear, founder of NØID Labs (Synqra × NØID × AuraFX). Reply to this ${comment.platform} comment in your exact tone.

COMMENT: "${comment.text}"

CONTEXT:
- Intent: ${intent}
- Sentiment: ${sentiment}
- Commenter: ${commenterType}
- Product fit: ${productFit}
- Style: ${style}

YOUR TONE PROFILE:
- Clarity: 95/100 (extremely direct)
- Warmth: 75/100 (friendly but not overly casual)
- Wit: 80/100 (engaging, playful when appropriate)
- Authority: 90/100 (confident, knowledgeable)
- Brevity: 85/100 (concise, no fluff)

RULES (NEVER VIOLATE):
✅ Be direct and clear
✅ Use active voice
✅ Write like you talk
✅ Show personality
✅ Be helpful first
✅ Maintain premium feel

❌ NO corporate jargon
❌ NO robotic language
❌ NO excessive exclamation marks
❌ NO "Sorry for the inconvenience"
❌ NO "Thank you for reaching out"
❌ NO "Feel free to contact us"

START WITH: ${opener}
END WITH: ${closer}

Generate a reply (max 2-3 sentences):`;
}

/**
 * Should include CTA?
 */
function shouldIncludeCTA(
  intent: Intent,
  commenterType: CommenterType,
  conversionPotential: number
): boolean {
  // Always include CTA for buying signals
  if (intent === "buying_signal") return true;

  // Include CTA for high-value leads
  if (commenterType === "high_value_lead") return true;

  // Include CTA for high conversion potential
  if (conversionPotential >= 70) return true;

  // Include CTA for help requests (can guide to product)
  if (intent === "request_help" && conversionPotential >= 50) return true;

  return false;
}

/**
 * Determine CTA type
 */
function determineCTAType(
  intent: Intent,
  productFit: string
): "product" | "support" | "content" | "waitlist" {
  if (intent === "buying_signal") return "product";
  if (intent === "request_help") return "support";
  if (productFit === "synqra" || productFit === "noid" || productFit === "aurafx") return "waitlist";
  return "content";
}

/**
 * Add CTA to reply
 */
function addCTA(
  replyText: string,
  ctaType: "product" | "support" | "content" | "waitlist",
  productFit: string
): string {
  const supportEmail = process.env.SUPPORT_EMAIL ?? "";

  const ctas = {
    product: {
      synqra: "Want to see how Synqra works for your content?",
      noid: "Want to see how NØID tracks your mileage automatically?",
      aurafx: "Want to see how AuraFX improves your trading strategy?",
      default: "Want to learn more?",
    },
    support: {
      synqra: supportEmail
        ? `Need help? Hit me up at ${supportEmail}`
        : "Need help? Reach out to support.",
      noid: supportEmail
        ? `Need help? Reach out at ${supportEmail}`
        : "Need help? Reach out to support.",
      aurafx: supportEmail
        ? `Need help? Contact ${supportEmail}`
        : "Need help? Reach out to support.",
      default: "Need help? Let me know.",
    },
    content: {
      default: "Check our docs for more: docs.noidlabs.com",
    },
    waitlist: {
      synqra: "Join the waitlist: synqra.app/waitlist",
      noid: "Join the waitlist: noid.app/waitlist",
      aurafx: "Join the waitlist: aurafx.ai/waitlist",
      default: "Join the waitlist at noidlabs.com",
    },
  };

  const ctaText =
    ctas[ctaType][productFit as keyof typeof ctas.product] ||
    ctas[ctaType].default ||
    "";

  return `${replyText}\n\n${ctaText}`;
}

/**
 * Generate quick reply (rules-based, zero cost)
 */
export function generateQuickReply(
  intent: Intent,
  productFit: string
): string | null {
  const quickReplies: Partial<Record<Intent, string>> = {
    praise: "Glad it's working for you.",
    casual: "Appreciate it.",
    unclear: "What specifically are you asking about?",
  };

  return quickReplies[intent] || null;
}
