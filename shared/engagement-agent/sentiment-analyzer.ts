/**
 * ============================================================
 * SENTIMENT ANALYZER
 * ============================================================
 * Detects tone, emotion, intent, and sentiment in comments
 * 
 * RPRD DNA: Intelligent, fast, accurate
 */

import type { Sentiment, Intent, Emotion, CommentSource } from "./types";

/**
 * Sentiment keywords (weighted)
 */
const SENTIMENT_KEYWORDS = {
  positive: {
    high: ["amazing", "excellent", "perfect", "love", "best", "awesome", "brilliant", "fantastic"],
    medium: ["good", "great", "nice", "helpful", "thanks", "appreciate", "works", "solid"],
    low: ["ok", "fine", "decent", "alright", "not bad"],
  },
  negative: {
    high: ["terrible", "awful", "worst", "hate", "garbage", "trash", "useless", "scam"],
    medium: ["bad", "poor", "disappointing", "broken", "doesn't work", "frustrated", "annoyed"],
    low: ["meh", "underwhelming", "confusing", "unclear", "slow"],
  },
};

/**
 * Intent patterns
 */
const INTENT_PATTERNS: Record<Intent, RegExp[]> = {
  question: [
    /\?$/,
    /^(how|what|when|where|why|who|can|could|would|should|is|are|does)/i,
    /\b(help|explain|show me|tell me)\b/i,
  ],
  feedback: [
    /\b(feedback|suggestion|idea|would be (better|nice|cool))\b/i,
    /\b(should|could|might want to)\b/i,
  ],
  complaint: [
    /\b(broken|doesn't work|not working|issue|problem|bug|error)\b/i,
    /\b(frustrated|annoyed|disappointed|upset)\b/i,
  ],
  praise: [
    /\b(love|amazing|excellent|perfect|best|awesome|great job)\b/i,
    /\b(thank|thanks|appreciate|grateful)\b/i,
  ],
  request_feature: [
    /\b(add|need|want|wish|please (add|include|make))\b/i,
    /\b(feature request|would love to see)\b/i,
  ],
  request_help: [
    /\b(help|support|assist|can you|could you)\b/i,
    /\b(stuck|lost|confused|don't understand)\b/i,
  ],
  spam: [
    /\b(click here|buy now|limited time|act now|winner|prize|free money)\b/i,
    /\b(http|www\.|\.com|\.net|\.org)\b/i, // URLs
  ],
  troll: [
    /\b(lol|lmao|haha|cringe|trash|cope|seethe|ratio)\b/i,
    /[🤡😂💀🔥]{3,}/, // Excessive emojis
  ],
  buying_signal: [
    /\b(price|cost|pricing|how much|subscribe|sign up|join|buy|purchase)\b/i,
    /\b(trial|demo|test|try|waitlist)\b/i,
  ],
  casual: [
    /^(nice|cool|neat|interesting)$/i,
    /^(thanks|thank you)$/i,
  ],
  unclear: [], // Default if no other intent matches
};

/**
 * Emotion patterns
 */
const EMOTION_PATTERNS: Record<Emotion, RegExp[]> = {
  happy: [
    /\b(happy|excited|love|awesome|amazing|great|perfect)\b/i,
    /[😊😃😄🎉✨]/,
  ],
  excited: [
    /\b(can't wait|so excited|hyped|stoked|pumped)\b/i,
    /!{2,}/, // Multiple exclamation marks
  ],
  frustrated: [
    /\b(frustrated|annoyed|irritated|aggravated)\b/i,
    /\b(why (is|does|won't|can't))\b/i,
  ],
  angry: [
    /\b(angry|furious|pissed|hate|terrible|worst)\b/i,
    /[😠😡🤬]/,
  ],
  confused: [
    /\b(confused|don't understand|unclear|what|how|huh|wait)\b/i,
    /\?{2,}/, // Multiple question marks
  ],
  neutral: [], // Default
  sarcastic: [
    /\b(yeah right|sure|obviously|totally|great job)\b.*[🙄]/i,
    /\b(wow|amazing|brilliant)\b.*\b(not|never)\b/i,
  ],
  grateful: [
    /\b(thank|thanks|appreciate|grateful|helped|saved)\b/i,
    /🙏/,
  ],
};

/**
 * Analyze sentiment
 */
export function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  // Score positive keywords
  for (const [weight, keywords] of Object.entries(SENTIMENT_KEYWORDS.positive)) {
    const multiplier = weight === "high" ? 3 : weight === "medium" ? 2 : 1;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        positiveScore += multiplier;
      }
    }
  }

  // Score negative keywords
  for (const [weight, keywords] of Object.entries(SENTIMENT_KEYWORDS.negative)) {
    const multiplier = weight === "high" ? 3 : weight === "medium" ? 2 : 1;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        negativeScore += multiplier;
      }
    }
  }

  // Determine sentiment
  if (positiveScore > negativeScore + 2) return "positive";
  if (negativeScore > positiveScore + 2) return "negative";
  if (positiveScore > 0 && negativeScore > 0) return "mixed";
  return "neutral";
}

/**
 * Detect intent
 */
export function detectIntent(text: string): Intent {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return intent as Intent;
      }
    }
  }
  return "unclear";
}

/**
 * Detect emotion
 */
export function detectEmotion(text: string): Emotion {
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return emotion as Emotion;
      }
    }
  }
  return "neutral";
}

/**
 * Calculate engagement quality (0-100)
 */
export function calculateEngagementQuality(comment: CommentSource): number {
  let score = 50; // Start at neutral

  // Text length (sweet spot: 20-200 chars)
  const textLength = comment.text.length;
  if (textLength >= 20 && textLength <= 200) {
    score += 20;
  } else if (textLength < 10 || textLength > 500) {
    score -= 20;
  }

  // Metadata signals
  if (comment.metadata) {
    // Verified accounts are higher quality
    if (comment.metadata.verified) {
      score += 15;
    }

    // Follower count (higher = more influence)
    if (comment.metadata.followerCount) {
      if (comment.metadata.followerCount > 10000) score += 15;
      else if (comment.metadata.followerCount > 1000) score += 10;
      else if (comment.metadata.followerCount > 100) score += 5;
    }

    // Account age (older = more trustworthy)
    if (comment.metadata.accountAge) {
      if (comment.metadata.accountAge > 365) score += 10;
      else if (comment.metadata.accountAge > 90) score += 5;
      else if (comment.metadata.accountAge < 7) score -= 15; // New accounts suspicious
    }

    // Likes on comment (engagement indicator)
    if (comment.metadata.likes && comment.metadata.likes > 0) {
      score += Math.min(20, comment.metadata.likes * 2);
    }
  }

  // Content quality signals
  const lower = comment.text.toLowerCase();

  // Penalize spam indicators
  if (/\b(http|www\.|\.com)\b/i.test(comment.text)) score -= 25;
  if (/\b(click here|buy now|limited time)\b/i.test(lower)) score -= 30;
  
  // Penalize low-effort
  if (/^(lol|lmao|first|nice|cool)$/i.test(comment.text.trim())) score -= 20;
  
  // Reward thoughtful engagement
  if (comment.text.includes("?")) score += 5; // Questions
  if (textLength > 50) score += 10; // Longer comments
  if (/\b(because|reason|think|believe|experience)\b/i.test(lower)) score += 10; // Thoughtful

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate conversion potential (0-100)
 */
export function calculateConversionPotential(
  comment: CommentSource,
  intent: Intent,
  sentiment: Sentiment
): number {
  let score = 30; // Base score

  // Intent-based scoring
  const intentScores: Record<Intent, number> = {
    buying_signal: 90,
    request_help: 70,
    question: 60,
    request_feature: 50,
    praise: 45,
    feedback: 40,
    casual: 30,
    complaint: 25,
    unclear: 20,
    troll: 5,
    spam: 0,
  };

  score = intentScores[intent] || 20;

  // Sentiment boost
  if (sentiment === "positive") score += 15;
  else if (sentiment === "negative") score -= 10;

  // Keywords boost
  const lower = comment.text.toLowerCase();
  const highValueKeywords = [
    "price",
    "pricing",
    "cost",
    "buy",
    "purchase",
    "subscribe",
    "trial",
    "demo",
    "sign up",
    "how much",
  ];

  for (const keyword of highValueKeywords) {
    if (lower.includes(keyword)) {
      score += 10;
      break; // Only count once
    }
  }

  // Engagement quality boost
  const engagementQuality = calculateEngagementQuality(comment);
  score += (engagementQuality - 50) * 0.3; // Adjust by quality

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate response urgency (0-100)
 */
export function calculateResponseUrgency(
  intent: Intent,
  sentiment: Sentiment,
  emotion: Emotion
): number {
  let score = 50; // Base urgency

  // Intent urgency
  const intentUrgency: Record<Intent, number> = {
    buying_signal: 95, // Extremely urgent
    complaint: 90, // Very urgent
    request_help: 85, // Very urgent
    question: 70, // Moderately urgent
    request_feature: 50, // Medium urgency
    feedback: 45, // Medium urgency
    praise: 30, // Low urgency
    casual: 20, // Low urgency
    unclear: 40, // Medium urgency
    troll: 5, // Very low urgency
    spam: 0, // No urgency
  };

  score = intentUrgency[intent] || 50;

  // Sentiment modifier
  if (sentiment === "negative") score += 20;
  else if (sentiment === "positive") score -= 10;

  // Emotion modifier
  const emotionUrgency: Record<Emotion, number> = {
    angry: 25,
    frustrated: 20,
    confused: 15,
    excited: -5,
    happy: -10,
    grateful: -10,
    neutral: 0,
    sarcastic: 5,
  };

  score += emotionUrgency[emotion] || 0;

  return Math.max(0, Math.min(100, score));
}

/**
 * Full sentiment analysis
 */
export function analyzeComment(comment: CommentSource): {
  sentiment: Sentiment;
  intent: Intent;
  emotion: Emotion;
  engagementQuality: number;
  conversionPotential: number;
  responseUrgency: number;
} {
  const sentiment = analyzeSentiment(comment.text);
  const intent = detectIntent(comment.text);
  const emotion = detectEmotion(comment.text);
  const engagementQuality = calculateEngagementQuality(comment);
  const conversionPotential = calculateConversionPotential(comment, intent, sentiment);
  const responseUrgency = calculateResponseUrgency(intent, sentiment, emotion);

  return {
    sentiment,
    intent,
    emotion,
    engagementQuality,
    conversionPotential,
    responseUrgency,
  };
}
