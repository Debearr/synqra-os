/**
 * ============================================================
 * COMMENTER CLASSIFIER
 * ============================================================
 * Classifies commenters into actionable segments
 * 
 * RPRD DNA: Intelligent, fast, accurate
 */

import type { CommentSource, CommenterType, Intent, Sentiment } from "./types";

/**
 * Classify commenter based on behavior and context
 */
export function classifyCommenter(
  comment: CommentSource,
  intent: Intent,
  sentiment: Sentiment,
  engagementQuality: number,
  conversionPotential: number
): CommenterType {
  // High-value lead detection
  if (
    conversionPotential >= 80 &&
    engagementQuality >= 70 &&
    (intent === "buying_signal" || intent === "request_help" || intent === "question")
  ) {
    return "high_value_lead";
  }

  // Potential customer detection
  if (
    conversionPotential >= 60 &&
    (intent === "buying_signal" ||
      intent === "question" ||
      intent === "request_feature" ||
      intent === "request_help")
  ) {
    return "potential_customer";
  }

  // Current user detection
  const userIndicators = [
    /\b(i use|i'm using|i have|my account|my subscription)\b/i,
    /\b(in the app|on the platform|in synqra|in noid|in aurafx)\b/i,
  ];
  
  for (const pattern of userIndicators) {
    if (pattern.test(comment.text)) {
      return "current_user";
    }
  }

  // Troll detection
  if (
    intent === "troll" ||
    (sentiment === "negative" && engagementQuality < 30) ||
    /\b(cope|seethe|ratio|cringe)\b/i.test(comment.text)
  ) {
    return "troll";
  }

  // Bot detection
  const botIndicators = [
    comment.text.length < 10 && /^(first|nice|cool|wow)$/i.test(comment.text),
    comment.metadata?.accountAge !== undefined && comment.metadata.accountAge < 1,
    /^[\u{1F300}-\u{1F9FF}]{3,}$/u.test(comment.text), // Only emojis
  ];

  if (botIndicators.some((indicator) => indicator)) {
    return "bot";
  }

  // Spammer detection
  if (
    intent === "spam" ||
    /\b(http|www\.|\.com|\.net)\b/i.test(comment.text) ||
    /\b(click here|buy now|limited time|free money)\b/i.test(comment.text)
  ) {
    return "spammer";
  }

  // Confused user detection
  if (
    intent === "unclear" ||
    intent === "question" &&
    /\b(confused|don't understand|unclear|what|how|huh)\b/i.test(comment.text)
  ) {
    return "confused_user";
  }

  // Default: general audience
  return "general_audience";
}

/**
 * Calculate brand risk (0-100)
 * Higher = more risk to brand if we reply or ignore
 */
export function calculateBrandRisk(
  commenterType: CommenterType,
  toxicityLevel: string,
  sentiment: Sentiment,
  metadata?: CommentSource["metadata"]
): number {
  let risk = 0;

  // Commenter type risk
  const typeRisk: Record<CommenterType, number> = {
    high_value_lead: 5, // Low risk
    potential_customer: 10,
    current_user: 15, // Moderate risk if ignored
    confused_user: 20,
    general_audience: 25,
    bot: 5, // Low risk
    spammer: 10,
    troll: 40, // High risk if engaged
  };

  risk = typeRisk[commenterType] || 25;

  // Toxicity risk
  const toxicityRisk: Record<string, number> = {
    safe: 0,
    mild: 10,
    moderate: 30,
    severe: 60,
    extreme: 90,
  };

  risk += toxicityRisk[toxicityLevel] || 0;

  // Sentiment risk
  if (sentiment === "negative") risk += 15;
  else if (sentiment === "positive") risk -= 10;

  // Influence risk (verified accounts with many followers)
  if (metadata?.verified) risk += 10;
  if (metadata?.followerCount && metadata.followerCount > 10000) risk += 15;
  else if (metadata?.followerCount && metadata.followerCount > 1000) risk += 5;

  return Math.max(0, Math.min(100, risk));
}

/**
 * Determine if we should reply
 */
export function shouldReply(
  commenterType: CommenterType,
  intent: Intent,
  toxicityLevel: string,
  spamType: string,
  brandRisk: number,
  conversionPotential: number
): boolean {
  // Never reply to severe/extreme toxicity
  if (toxicityLevel === "severe" || toxicityLevel === "extreme") {
    return false;
  }

  // Never reply to spam
  if (spamType !== "none") {
    return false;
  }

  // Never reply to trolls (feeds them)
  if (commenterType === "troll") {
    return false;
  }

  // Never reply to bots (unless high conversion potential)
  if (commenterType === "bot" && conversionPotential < 70) {
    return false;
  }

  // Always reply to high-value leads
  if (commenterType === "high_value_lead") {
    return true;
  }

  // Always reply to buying signals
  if (intent === "buying_signal") {
    return true;
  }

  // Always reply to help requests
  if (intent === "request_help") {
    return true;
  }

  // Reply to questions if conversion potential is decent
  if (intent === "question" && conversionPotential >= 40) {
    return true;
  }

  // Reply to feedback if constructive
  if (intent === "feedback" && toxicityLevel === "safe") {
    return true;
  }

  // Reply to complaints if brand risk is moderate-high
  if (intent === "complaint" && brandRisk >= 30) {
    return true;
  }

  // Reply to current users
  if (commenterType === "current_user") {
    return true;
  }

  // Reply to potential customers
  if (commenterType === "potential_customer") {
    return true;
  }

  // Reply to confused users
  if (commenterType === "confused_user") {
    return true;
  }

  // Default: don't reply
  return false;
}

/**
 * Determine if human review is required
 */
export function requiresHumanReview(
  commenterType: CommenterType,
  toxicityLevel: string,
  brandRisk: number,
  conversionPotential: number
): boolean {
  // High brand risk always requires review
  if (brandRisk >= 60) {
    return true;
  }

  // Moderate toxicity requires review
  if (toxicityLevel === "moderate" || toxicityLevel === "severe") {
    return true;
  }

  // High-value leads require review (too important to automate)
  if (commenterType === "high_value_lead" && conversionPotential >= 90) {
    return true;
  }

  // Current users with complaints require review
  if (commenterType === "current_user" && brandRisk >= 40) {
    return true;
  }

  return false;
}
