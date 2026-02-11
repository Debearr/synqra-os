/**
 * ============================================================
 * ANTI-ABUSE GUARDRAILS
 * ============================================================
 * Protect compute resources from misuse without punishing honest users
 * 
 * RULES:
 * - Detect mass-generation attempts
 * - Apply soft throttles and cooldown windows
 * - Prevent full production workflows on free tier
 * - Gentle upgrade prompts (Chris Do style: educate, don't pressure)
 * 
 * RPRD DNA: Fair, intelligent, protective
 */

import type { ThumbnailTier } from "./tier-access";

export type AbuseSignal =
  | "rapid_requests" // Multiple requests in short time
  | "scripted_pattern" // Automated behavior detected
  | "resource_exhaustion" // Excessive token usage
  | "batch_on_free" // Attempting batch on free tier
  | "repeated_failures"; // Multiple failed generations

export type ThrottleAction =
  | "none"
  | "soft_throttle" // Add delay
  | "cooldown" // Temporary block
  | "hard_block"; // Permanent block (rare)

export type AbuseCheck = {
  allowed: boolean;
  action: ThrottleAction;
  reason?: string;
  cooldownUntil?: Date;
  educationalMessage?: string; // Chris Do style
  upgradePrompt?: string;
};

/**
 * Rate limiting windows
 */
export const RATE_LIMITS: Record<
  ThumbnailTier,
  {
    requestsPerMinute: number;
    requestsPerHour: number;
    maxConcurrent: number;
    cooldownMinutes: number; // After limit reached
  }
> = {
  free: {
    requestsPerMinute: 1,
    requestsPerHour: 3,
    maxConcurrent: 1,
    cooldownMinutes: 15,
  },

  pro: {
    requestsPerMinute: 5,
    requestsPerHour: 50,
    maxConcurrent: 3,
    cooldownMinutes: 5,
  },

  elite: {
    requestsPerMinute: 20,
    requestsPerHour: 200,
    maxConcurrent: 10,
    cooldownMinutes: 2,
  },
};

/**
 * Abuse detection thresholds
 */
export const ABUSE_THRESHOLDS = {
  // Rapid requests (within 1 second)
  rapidRequestWindow: 1000, // milliseconds
  rapidRequestMax: 3,

  // Scripted pattern detection
  identicalRequestsMax: 5, // Same prompt/platform combo
  suspiciousUserAgent: ["bot", "crawler", "script", "automation"],

  // Resource exhaustion
  tokenUsagePerHour: {
    free: 5000,
    pro: 50000,
    elite: 200000,
  },

  // Repeated failures
  maxFailuresPerHour: 10,
};

/**
 * Check for abuse signals
 */
export async function checkForAbuse(
  userId: string,
  tier: ThumbnailTier,
  requestMetadata: {
    userAgent?: string;
    ipAddress?: string;
    requestCount: {
      lastMinute: number;
      lastHour: number;
      lastDay: number;
    };
    recentRequests: Array<{
      timestamp: Date;
      prompt: string;
      platform: string;
    }>;
    tokensUsedThisHour: number;
    failuresThisHour: number;
  }
): Promise<AbuseCheck> {
  const limits = RATE_LIMITS[tier];

  // Check rate limits
  if (requestMetadata.requestCount.lastMinute >= limits.requestsPerMinute) {
    return {
      allowed: false,
      action: "soft_throttle",
      reason: "Rate limit exceeded",
      cooldownUntil: new Date(Date.now() + limits.cooldownMinutes * 60000),
      educationalMessage:
        "You're creating thumbnails faster than most users. Take a moment to review your results—quality over speed leads to better performance.",
      upgradePrompt:
        tier === "free"
          ? "Pro tier increases your rate limit to 5 per minute."
          : undefined,
    };
  }

  if (requestMetadata.requestCount.lastHour >= limits.requestsPerHour) {
    return {
      allowed: false,
      action: "cooldown",
      reason: "Hourly limit reached",
      cooldownUntil: new Date(Date.now() + limits.cooldownMinutes * 60000),
      educationalMessage:
        "You've reached your hourly limit. Most creators use this time to test their thumbnails with real audiences before generating more.",
      upgradePrompt:
        tier === "free"
          ? "Pro tier gives you 50 generations per hour."
          : tier === "pro"
          ? "Elite tier offers hard capped generations with intelligent throttling."
          : undefined,
    };
  }

  // Check for rapid requests (potential scripting)
  const recentTimestamps = requestMetadata.recentRequests
    .map((r) => r.timestamp.getTime())
    .slice(-ABUSE_THRESHOLDS.rapidRequestMax);

  if (recentTimestamps.length >= ABUSE_THRESHOLDS.rapidRequestMax) {
    const timeDiff =
      recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0];

    if (timeDiff < ABUSE_THRESHOLDS.rapidRequestWindow) {
      return {
        allowed: false,
        action: "cooldown",
        reason: "Rapid requests detected",
        cooldownUntil: new Date(Date.now() + 5 * 60000), // 5 min cooldown
        educationalMessage:
          "Detected rapid-fire requests. Synqra works best when you take time to refine each thumbnail. Quality beats quantity.",
        upgradePrompt:
          "If you need batch production, Elite tier is built for that workflow.",
      };
    }
  }

  // Check for identical requests (potential abuse)
  const recentPrompts = requestMetadata.recentRequests
    .slice(-ABUSE_THRESHOLDS.identicalRequestsMax)
    .map((r) => `${r.prompt}:${r.platform}`);

  const uniquePrompts = new Set(recentPrompts);

  if (
    recentPrompts.length >= ABUSE_THRESHOLDS.identicalRequestsMax &&
    uniquePrompts.size === 1
  ) {
    return {
      allowed: false,
      action: "soft_throttle",
      reason: "Duplicate requests detected",
      educationalMessage:
        "You've generated the same thumbnail multiple times. Try refining your prompt or experimenting with different platforms instead.",
    };
  }

  // Check for suspicious user agent
  if (requestMetadata.userAgent) {
    const isSuspicious = ABUSE_THRESHOLDS.suspiciousUserAgent.some((pattern) =>
      requestMetadata.userAgent!.toLowerCase().includes(pattern)
    );

    if (isSuspicious && tier === "free") {
      return {
        allowed: false,
        action: "hard_block",
        reason: "Automated access detected",
        educationalMessage:
          "Automated access is not allowed on the free tier. If you need API access or batch production, please upgrade to Elite.",
        upgradePrompt: "Elite tier includes API access for automation.",
      };
    }
  }

  // Check token usage (resource exhaustion)
  const tokenLimit = ABUSE_THRESHOLDS.tokenUsagePerHour[tier];

  if (requestMetadata.tokensUsedThisHour >= tokenLimit) {
    return {
      allowed: false,
      action: "cooldown",
      reason: "Resource limit reached",
      cooldownUntil: new Date(Date.now() + 60 * 60000), // 1 hour cooldown
      educationalMessage:
        "You've used all your allocated compute for this hour. This limit protects system stability for all users.",
      upgradePrompt:
        tier === "free"
          ? "Pro tier offers 10x more compute resources."
          : tier === "pro"
          ? "Elite tier offers hard capped compute with intelligent throttling."
          : undefined,
    };
  }

  // Check for repeated failures
  if (requestMetadata.failuresThisHour >= ABUSE_THRESHOLDS.maxFailuresPerHour) {
    return {
      allowed: false,
      action: "soft_throttle",
      reason: "Multiple failed requests",
      educationalMessage:
        "You've had several failed generations. This usually means your prompts need refinement. Try being more specific about what you want.",
      upgradePrompt:
        "Pro tier includes advanced prompt suggestions to help you succeed faster.",
    };
  }

  // All checks passed
  return {
    allowed: true,
    action: "none",
  };
}

/**
 * Apply throttle (add artificial delay)
 */
export async function applyThrottle(
  action: ThrottleAction,
  tier: ThumbnailTier
): Promise<void> {
  if (action === "none") return;

  const delays: Record<ThrottleAction, number> = {
    none: 0,
    soft_throttle: tier === "free" ? 3000 : 1000, // 3s free, 1s pro/elite
    cooldown: 0, // Handled by cooldownUntil
    hard_block: 0, // Permanent
  };

  const delay = delays[action];
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Get user-friendly message for throttle action
 */
export function getThrottleMessage(check: AbuseCheck): string {
  if (check.action === "none") return "";

  const messages: Record<ThrottleAction, string> = {
    none: "",
    soft_throttle: "Taking a moment to ensure quality...",
    cooldown: `Please wait ${
      check.cooldownUntil
        ? Math.ceil(
            (check.cooldownUntil.getTime() - Date.now()) / 60000
          ) + " minutes"
        : "a few minutes"
    } before generating more thumbnails.`,
    hard_block: "Access restricted. Please contact support.",
  };

  return messages[check.action];
}

/**
 * Log abuse attempt (for monitoring)
 */
export async function logAbuseAttempt(
  userId: string,
  signal: AbuseSignal,
  metadata: Record<string, any>
): Promise<void> {
  // TODO: Write to Supabase `thumbnail_abuse_logs` table

  if (process.env.NODE_ENV === "development") {
    console.warn("[ABUSE DETECTED]", {
      userId,
      signal,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
}
