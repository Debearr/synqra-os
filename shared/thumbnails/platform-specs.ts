/**
 * ============================================================
 * PLATFORM-SPECIFIC THUMBNAIL INTELLIGENCE
 * ============================================================
 * Exact specs for every major platform
 * Zero-cost validation and auto-correction
 * 
 * RPRD DNA: Rules-based, no model calls needed
 */

export type Platform =
  | "youtube"
  | "instagram_feed"
  | "instagram_story"
  | "instagram_reel"
  | "tiktok"
  | "linkedin"
  | "facebook"
  | "twitter"
  | "twitter_card";

export type PlatformSpec = {
  name: string;
  displayName: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioDecimal: number;
  minWidth: number;
  minHeight: number;
  maxFileSize: number; // in MB
  format: ("jpg" | "png" | "webp")[];
  titleSafeZone: {
    top: number; // percentage
    bottom: number;
    left: number;
    right: number;
  };
  textReadability: {
    minFontSize: number; // pixels
    maxTextWidth: number; // percentage of canvas
    recommendedContrast: number; // WCAG AA = 4.5, AAA = 7
  };
  creativeGuidelines: {
    focusPoint: "center" | "upper-third" | "lower-third" | "left-third";
    textPlacement: "top" | "bottom" | "center" | "left" | "right";
    visualStyle: string;
    keyOptimizations: string[];
  };
};

export const PLATFORM_SPECS: Record<Platform, PlatformSpec> = {
  youtube: {
    name: "youtube",
    displayName: "YouTube",
    width: 1280,
    height: 720,
    aspectRatio: "16:9",
    aspectRatioDecimal: 16 / 9,
    minWidth: 640,
    minHeight: 360,
    maxFileSize: 2,
    format: ["jpg", "png"],
    titleSafeZone: {
      top: 10,
      bottom: 15,
      left: 10,
      right: 10,
    },
    textReadability: {
      minFontSize: 48,
      maxTextWidth: 80,
      recommendedContrast: 7, // AAA standard for YouTube
    },
    creativeGuidelines: {
      focusPoint: "center",
      textPlacement: "bottom",
      visualStyle: "Bold, high-contrast, clear emotional read at a glance",
      keyOptimizations: [
        "Strong focal point (face or object)",
        "Bold, readable title text",
        "High contrast background",
        "Emotional trigger visible in 2 seconds",
        "Avoid small details (viewed at ~200px wide)",
      ],
    },
  },

  instagram_feed: {
    name: "instagram_feed",
    displayName: "Instagram Feed",
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    aspectRatioDecimal: 4 / 5,
    minWidth: 600,
    minHeight: 750,
    maxFileSize: 8,
    format: ["jpg", "png"],
    titleSafeZone: {
      top: 5,
      bottom: 5,
      left: 5,
      right: 5,
    },
    textReadability: {
      minFontSize: 32,
      maxTextWidth: 85,
      recommendedContrast: 4.5,
    },
    creativeGuidelines: {
      focusPoint: "center",
      textPlacement: "center",
      visualStyle: "Aesthetic, color-cohesive, save-worthy designs",
      keyOptimizations: [
        "Vertical composition (portrait)",
        "Cohesive color palette",
        "Clean, minimal text (if any)",
        "High visual appeal (save-worthy)",
        "Brand-consistent aesthetic",
      ],
    },
  },

  instagram_story: {
    name: "instagram_story",
    displayName: "Instagram Story",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    aspectRatioDecimal: 9 / 16,
    minWidth: 600,
    minHeight: 1067,
    maxFileSize: 8,
    format: ["jpg", "png"],
    titleSafeZone: {
      top: 15, // Profile pic + swipe-up area
      bottom: 20, // CTA area
      left: 5,
      right: 5,
    },
    textReadability: {
      minFontSize: 40,
      maxTextWidth: 80,
      recommendedContrast: 4.5,
    },
    creativeGuidelines: {
      focusPoint: "center",
      textPlacement: "center",
      visualStyle: "Full-screen vertical, fast-read layouts",
      keyOptimizations: [
        "Full-bleed vertical design",
        "Avoid top 15% (profile pic covers)",
        "Avoid bottom 20% (swipe-up area)",
        "Strong center-of-frame energy",
        "Quick read (viewed for 3-5 seconds)",
      ],
    },
  },

  instagram_reel: {
    name: "instagram_reel",
    displayName: "Instagram Reel",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    aspectRatioDecimal: 9 / 16,
    minWidth: 600,
    minHeight: 1067,
    maxFileSize: 8,
    format: ["jpg", "png"],
    titleSafeZone: {
      top: 20, // UI elements
      bottom: 25, // Engagement buttons
      left: 5,
      right: 5,
    },
    textReadability: {
      minFontSize: 44,
      maxTextWidth: 75,
      recommendedContrast: 7, // High contrast for mobile
    },
    creativeGuidelines: {
      focusPoint: "center",
      textPlacement: "top",
      visualStyle: "Vertical, full-screen, strong center energy",
      keyOptimizations: [
        "Center-weighted composition",
        "Avoid bottom 25% (buttons cover)",
        "Bold, quick-read text",
        "Movement or energy implied",
        "Mobile-first design",
      ],
    },
  },

  tiktok: {
    name: "tiktok",
    displayName: "TikTok",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    aspectRatioDecimal: 9 / 16,
    minWidth: 600,
    minHeight: 1067,
    maxFileSize: 10,
    format: ["jpg", "png"],
    titleSafeZone: {
      top: 18, // Username + caption area
      bottom: 28, // Engagement buttons + caption
      left: 5,
      right: 5,
    },
    textReadability: {
      minFontSize: 48,
      maxTextWidth: 70,
      recommendedContrast: 7,
    },
    creativeGuidelines: {
      focusPoint: "center",
      textPlacement: "center",
      visualStyle: "Vertical, full-screen, fast-read, energetic",
      keyOptimizations: [
        "Strong center focus (avoid edges)",
        "Bold, punchy text",
        "High energy/movement implied",
        "Avoid top 18% and bottom 28%",
        "Designed for 1-3 second attention span",
      ],
    },
  },

  linkedin: {
    name: "linkedin",
    displayName: "LinkedIn",
    width: 1200,
    height: 627,
    aspectRatio: "1.91:1",
    aspectRatioDecimal: 1200 / 627,
    minWidth: 800,
    minHeight: 418,
    maxFileSize: 5,
    format: ["jpg", "png"],
    titleSafeZone: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
    },
    textReadability: {
      minFontSize: 36,
      maxTextWidth: 75,
      recommendedContrast: 7,
    },
    creativeGuidelines: {
      focusPoint: "left-third",
      textPlacement: "left",
      visualStyle: "Professional, minimal, thought-leadership clarity",
      keyOptimizations: [
        "Clean, minimal design (Chris Do style)",
        "Text hierarchy for thought-leadership",
        "Professional color palette",
        "Clear focal point (face or diagram)",
        "Avoid busy backgrounds",
      ],
    },
  },

  facebook: {
    name: "facebook",
    displayName: "Facebook",
    width: 1200,
    height: 630,
    aspectRatio: "1.91:1",
    aspectRatioDecimal: 1200 / 630,
    minWidth: 600,
    minHeight: 314,
    maxFileSize: 8,
    format: ["jpg", "png"],
    titleSafeZone: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    textReadability: {
      minFontSize: 32,
      maxTextWidth: 80,
      recommendedContrast: 4.5,
    },
    creativeGuidelines: {
      focusPoint: "center",
      textPlacement: "center",
      visualStyle: "Clear copy, broad appeal, strong CTA visibility",
      keyOptimizations: [
        "Clear call-to-action",
        "Broad audience appeal",
        "Simple, direct messaging",
        "Readable at small sizes",
        "Avoid complex visuals",
      ],
    },
  },

  twitter: {
    name: "twitter",
    displayName: "X (Twitter)",
    width: 1600,
    height: 900,
    aspectRatio: "16:9",
    aspectRatioDecimal: 16 / 9,
    minWidth: 800,
    minHeight: 450,
    maxFileSize: 5,
    format: ["jpg", "png", "webp"],
    titleSafeZone: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    textReadability: {
      minFontSize: 40,
      maxTextWidth: 75,
      recommendedContrast: 7,
    },
    creativeGuidelines: {
      focusPoint: "center",
      textPlacement: "center",
      visualStyle: "Snappy, text-forward, fast-scroll optimized",
      keyOptimizations: [
        "Bold, readable text",
        "High contrast",
        "Fast-read layout",
        "Text-forward design",
        "Optimized for quick scroll",
      ],
    },
  },

  twitter_card: {
    name: "twitter_card",
    displayName: "X (Twitter) Card",
    width: 1200,
    height: 628,
    aspectRatio: "1.91:1",
    aspectRatioDecimal: 1200 / 628,
    minWidth: 600,
    minHeight: 314,
    maxFileSize: 5,
    format: ["jpg", "png", "webp"],
    titleSafeZone: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    textReadability: {
      minFontSize: 36,
      maxTextWidth: 75,
      recommendedContrast: 7,
    },
    creativeGuidelines: {
      focusPoint: "left-third",
      textPlacement: "left",
      visualStyle: "Snappy, text-forward, link-optimized",
      keyOptimizations: [
        "Clear headline",
        "Preview-optimized layout",
        "Link-preview friendly",
        "Fast visual read",
        "Twitter brand colors work well",
      ],
    },
  },
};

/**
 * Validate and auto-correct thumbnail dimensions
 */
export function validateDimensions(
  platform: Platform,
  width: number,
  height: number
): {
  valid: boolean;
  corrected?: { width: number; height: number };
  warnings: string[];
} {
  const spec = PLATFORM_SPECS[platform];
  const warnings: string[] = [];

  // Check if dimensions match spec exactly
  if (width === spec.width && height === spec.height) {
    return { valid: true, warnings: [] };
  }

  // Check if aspect ratio is correct
  const userRatio = width / height;
  const specRatio = spec.aspectRatioDecimal;
  const ratioDiff = Math.abs(userRatio - specRatio);

  if (ratioDiff < 0.01) {
    // Aspect ratio is correct, just scale to spec
    return {
      valid: false,
      corrected: { width: spec.width, height: spec.height },
      warnings: [`Scaled to ${spec.displayName} spec (${spec.width}×${spec.height})`],
    };
  }

  // Check if dimensions are too small
  if (width < spec.minWidth || height < spec.minHeight) {
    warnings.push(
      `Resolution too low. Minimum: ${spec.minWidth}×${spec.minHeight}`
    );
  }

  // Aspect ratio is wrong, need to crop or pad
  warnings.push(
    `Aspect ratio mismatch. Expected ${spec.aspectRatio}, got ${userRatio.toFixed(2)}:1`
  );

  return {
    valid: false,
    corrected: { width: spec.width, height: spec.height },
    warnings,
  };
}

/**
 * Get platform spec by name
 */
export function getPlatformSpec(platform: Platform): PlatformSpec {
  return PLATFORM_SPECS[platform];
}

/**
 * Detect platform from dimensions (best guess)
 */
export function detectPlatform(
  width: number,
  height: number
): Platform | null {
  const ratio = width / height;

  // Find closest match by aspect ratio
  let closestPlatform: Platform | null = null;
  let closestDiff = Infinity;

  for (const [key, spec] of Object.entries(PLATFORM_SPECS)) {
    const diff = Math.abs(ratio - spec.aspectRatioDecimal);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestPlatform = key as Platform;
    }
  }

  // Only return if difference is small (< 5%)
  return closestDiff < 0.05 ? closestPlatform : null;
}

/**
 * Get all platform names
 */
export function getAllPlatforms(): Platform[] {
  return Object.keys(PLATFORM_SPECS) as Platform[];
}

/**
 * Get recommended export formats for a platform
 */
export function getRecommendedFormat(platform: Platform): string {
  const spec = PLATFORM_SPECS[platform];
  return spec.format[0]; // First format is recommended
}
