/**
 * ============================================================
 * TIER-BASED ACCESS CONTROL
 * ============================================================
 * Chris Do–style value ladder: Educate → Demonstrate → Invite
 * 
 * FREE: Test drive (learn the system)
 * PRO: Operate (full production)
 * ELITE: Scale (batch + automation)
 * 
 * RPRD DNA: No hard-sell, strategic guidance only
 */

export type ThumbnailTier = "free" | "pro" | "elite";

export type TierLimits = {
  tier: ThumbnailTier;
  displayName: string;
  
  // Generation Limits
  generationsPerMonth: number | "no_cap";
  generationsPerDay: number | "no_cap";
  generationsPerHour: number | "no_cap";
  batchSize: number; // Max thumbnails in one request
  
  // Quality & Features
  maxResolution: "reduced" | "full" | "ultra";
  watermark: boolean;
  brandAlignment: "basic" | "full" | "advanced";
  refinementPasses: number | "no_cap";
  priorityRouting: boolean;
  
  // Platform Features
  multiPlatformExport: boolean;
  batchProduction: boolean;
  brandKitSync: boolean;
  advancedAIVision: boolean;
  performancePresets: boolean;
  
  // Educational Features (Chris Do style)
  strategicTips: boolean;
  promptSuggestions: "none" | "basic" | "advanced";
  performanceInsights: boolean;
  
  // Support
  supportLevel: "community" | "email" | "priority";
  
  // Pricing
  priceMonthly: number;
  priceAnnual: number;
  
  // Value Messaging (Chris Do style: no hard-sell)
  valueProposition: string;
  upgradeMessage: string; // Shown when limits reached
};

export const TIER_LIMITS: Record<ThumbnailTier, TierLimits> = {
  free: {
    tier: "free",
    displayName: "Test Drive",
    
    // Generation Limits
    generationsPerMonth: 10,
    generationsPerDay: 3,
    generationsPerHour: 1,
    batchSize: 1,
    
    // Quality & Features
    maxResolution: "reduced", // 75% of native resolution
    watermark: true, // Small "Made with Synqra" watermark
    brandAlignment: "basic", // Colors + fonts only
    refinementPasses: 1,
    priorityRouting: false,
    
    // Platform Features
    multiPlatformExport: false,
    batchProduction: false,
    brandKitSync: false,
    advancedAIVision: false,
    performancePresets: false,
    
    // Educational Features
    strategicTips: true, // Chris Do–style tips
    promptSuggestions: "basic",
    performanceInsights: false,
    
    // Support
    supportLevel: "community",
    
    // Pricing
    priceMonthly: 0,
    priceAnnual: 0,
    
    // Value Messaging
    valueProposition: "Learn the system. See what premium thumbnails can do.",
    upgradeMessage: "You've mastered the basics. Ready to operate at full capacity? Pro unlocks native resolution, hard capped refinements, and strategic insights.",
  },

  pro: {
    tier: "pro",
    displayName: "Pro",
    
    // Generation Limits
    generationsPerMonth: 500,
    generationsPerDay: 50,
    generationsPerHour: 10,
    batchSize: 5,
    
    // Quality & Features
    maxResolution: "full", // Native platform resolution
    watermark: false,
    brandAlignment: "full", // Colors, fonts, spacing, logos
    refinementPasses: "no_cap",
    priorityRouting: true,
    
    // Platform Features
    multiPlatformExport: true,
    batchProduction: false, // Single-platform batch only
    brandKitSync: true,
    advancedAIVision: false,
    performancePresets: true,
    
    // Educational Features
    strategicTips: true,
    promptSuggestions: "advanced",
    performanceInsights: true,
    
    // Support
    supportLevel: "email",
    
    // Pricing
    priceMonthly: 49,
    priceAnnual: 470, // ~$39/mo (20% discount)
    
    // Value Messaging
    valueProposition: "Operate at full capacity. Native resolution, hard capped refinements, strategic insights.",
    upgradeMessage: "Scaling to multiple platforms? Elite adds batch production, advanced AI vision, and auto-sync with your brand kit.",
  },

  elite: {
    tier: "elite",
    displayName: "Elite",
    
    // Generation Limits
    generationsPerMonth: "no_cap",
    generationsPerDay: "no_cap",
    generationsPerHour: 50, // Soft limit to prevent abuse
    batchSize: 20,
    
    // Quality & Features
    maxResolution: "ultra", // Native + optional upscale
    watermark: false,
    brandAlignment: "advanced", // Full kit + mood board + auto-recovery
    refinementPasses: "no_cap",
    priorityRouting: true,
    
    // Platform Features
    multiPlatformExport: true,
    batchProduction: true, // Multi-platform export sets
    brandKitSync: true,
    advancedAIVision: true,
    performancePresets: true,
    
    // Educational Features
    strategicTips: true,
    promptSuggestions: "advanced",
    performanceInsights: true,
    
    // Support
    supportLevel: "priority",
    
    // Pricing
    priceMonthly: 149,
    priceAnnual: 1430, // ~$119/mo (20% discount)
    
    // Value Messaging
    valueProposition: "Scale effortlessly. Batch production, multi-platform exports, advanced AI vision.",
    upgradeMessage: "", // Already at top tier
  },
};

/**
 * Check if user can generate thumbnail (rate limiting)
 */
export function canGenerate(
  tier: ThumbnailTier,
  usage: {
    generationsThisMonth: number;
    generationsToday: number;
    generationsThisHour: number;
  }
): {
  allowed: boolean;
  reason?: string;
  upgradeMessage?: string;
} {
  const limits = TIER_LIMITS[tier];

  // Check monthly limit
  if (
    limits.generationsPerMonth !== "no_cap" &&
    usage.generationsThisMonth >= limits.generationsPerMonth
  ) {
    return {
      allowed: false,
      reason: "Monthly limit reached",
      upgradeMessage: limits.upgradeMessage,
    };
  }

  // Check daily limit
  if (
    limits.generationsPerDay !== "no_cap" &&
    usage.generationsToday >= limits.generationsPerDay
  ) {
    return {
      allowed: false,
      reason: "Daily limit reached",
      upgradeMessage: limits.upgradeMessage,
    };
  }

  // Check hourly limit
  if (
    limits.generationsPerHour !== "no_cap" &&
    usage.generationsThisHour >= limits.generationsPerHour
  ) {
    return {
      allowed: false,
      reason: "Hourly limit reached (cooldown period)",
      upgradeMessage: limits.upgradeMessage,
    };
  }

  return { allowed: true };
}

/**
 * Get tier limits
 */
export function getTierLimits(tier: ThumbnailTier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Check if feature is available for tier
 */
export function hasFeature(
  tier: ThumbnailTier,
  feature: keyof Omit<
    TierLimits,
    | "tier"
    | "displayName"
    | "generationsPerMonth"
    | "generationsPerDay"
    | "generationsPerHour"
    | "priceMonthly"
    | "priceAnnual"
    | "valueProposition"
    | "upgradeMessage"
  >
): boolean {
  const limits = TIER_LIMITS[tier];
  const value = limits[feature];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value !== "none" && value !== "basic"; // "basic" is limited
  }

  if (typeof value === "number") {
    return value > 0;
  }

  return false;
}

/**
 * Get Chris Do–style upgrade message (educate, don't pressure)
 */
export function getUpgradeGuidance(
  currentTier: ThumbnailTier,
  limitReached: "generation" | "feature" | "quality"
): {
  title: string;
  message: string;
  nextTier: ThumbnailTier | null;
  ctaText: string;
  educationalTip?: string;
} {
  if (currentTier === "free") {
    return {
      title: "You've mastered the basics",
      message:
        "Pro unlocks native resolution, hard capped refinements, and strategic insights to help your thumbnails perform better.",
      nextTier: "pro",
      ctaText: "Explore Pro features",
      educationalTip:
        limitReached === "quality"
          ? "Native resolution thumbnails get 40% more clicks on average."
          : limitReached === "feature"
          ? "Multi-platform export saves 10+ hours per week for most creators."
          : "Most professionals generate 20-50 thumbnails per month.",
    };
  }

  if (currentTier === "pro") {
    return {
      title: "Ready to scale?",
      message:
        "Elite adds batch production, advanced AI vision, and auto-sync with your brand kit—perfect for teams and multi-channel creators.",
      nextTier: "elite",
      ctaText: "Explore Elite features",
      educationalTip:
        limitReached === "feature"
          ? "Batch production lets you create a week's worth of thumbnails in one session."
          : "Advanced AI vision automatically corrects layouts for maximum performance.",
    };
  }

  return {
    title: "You're at the top",
    message: "You have access to all Elite features.",
    nextTier: null,
    ctaText: "",
  };
}

/**
 * Calculate value ladder positioning (for upgrade prompts)
 */
export function getValueLadderPosition(tier: ThumbnailTier): {
  current: number; // 1-3
  total: number; // 3
  next: ThumbnailTier | null;
  progression: string; // "Test Drive → Operate → Scale"
} {
  const positions: Record<ThumbnailTier, number> = {
    free: 1,
    pro: 2,
    elite: 3,
  };

  const nextTiers: Record<ThumbnailTier, ThumbnailTier | null> = {
    free: "pro",
    pro: "elite",
    elite: null,
  };

  return {
    current: positions[tier],
    total: 3,
    next: nextTiers[tier],
    progression: "Test Drive → Operate → Scale",
  };
}
