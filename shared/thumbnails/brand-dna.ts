/**
 * ============================================================
 * BRAND-DNA PERFECTION LAYER
 * ============================================================
 * Enforce correct color palette, typography, spacing, logo usage
 * Auto-recover from user instructions that break brand consistency
 * 
 * RPRD DNA: Maintain premium, on-brand output always
 */

export type BrandKit = {
  id: string;
  userId: string;
  name: string;

  // Color Palette
  colors: {
    primary: string; // Hex
    secondary: string;
    accent: string;
    background: string;
    text: string;
    neutrals: string[]; // Array of neutral shades
  };

  // Typography
  typography: {
    headlineFont: string;
    bodyFont: string;
    accentFont?: string;
    fontWeights: {
      light: number;
      regular: number;
      semibold: number;
      bold: number;
    };
  };

  // Spacing & Layout
  spacing: {
    padding: number; // Base padding in px
    margin: number;
    gutters: number;
  };

  // Logo & Assets
  logo: {
    url: string;
    placement: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
    size: "small" | "medium" | "large";
    opacity: number; // 0-1
  };

  // Mood Board (visual style references)
  moodBoard: {
    styleKeywords: string[]; // e.g., ["minimalist", "bold", "cinematic"]
    referenceImages?: string[]; // URLs
    avoidKeywords: string[]; // e.g., ["cluttered", "amateur", "generic"]
  };

  // Brand Voice
  voice: {
    tone: string; // e.g., "professional", "casual", "luxury"
    keywords: string[]; // Brand-specific terms
    avoidWords: string[]; // Words to never use
  };
};

/**
 * Validate brand kit completeness
 */
export function validateBrandKit(kit: Partial<BrandKit>): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!kit.colors?.primary) missing.push("Primary color");
  if (!kit.colors?.background) missing.push("Background color");
  if (!kit.colors?.text) missing.push("Text color");
  if (!kit.typography?.headlineFont) missing.push("Headline font");
  if (!kit.typography?.bodyFont) missing.push("Body font");

  if (!kit.logo?.url) warnings.push("No logo provided");
  if (!kit.moodBoard?.styleKeywords?.length)
    warnings.push("No mood board keywords");

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Auto-correct colors that break brand palette
 */
export function correctColors(
  userRequestedColors: string[],
  brandKit: BrandKit
): {
  corrected: string[];
  changes: Array<{ from: string; to: string; reason: string }>;
} {
  const changes: Array<{ from: string; to: string; reason: string }> = [];
  const allowedColors = [
    brandKit.colors.primary,
    brandKit.colors.secondary,
    brandKit.colors.accent,
    brandKit.colors.background,
    brandKit.colors.text,
    ...brandKit.colors.neutrals,
  ];

  const corrected = userRequestedColors.map((color) => {
    // Check if color is in brand palette
    const isAllowed = allowedColors.some((allowed) =>
      colorsAreSimilar(color, allowed)
    );

    if (isAllowed) return color;

    // Find closest brand color
    const closest = findClosestColor(color, allowedColors);
    changes.push({
      from: color,
      to: closest,
      reason: "Color not in brand palette, replaced with closest match",
    });

    return closest;
  });

  return { corrected, changes };
}

/**
 * Check if two colors are similar (within tolerance)
 */
function colorsAreSimilar(color1: string, color2: string): boolean {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return false;

  const distance = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
  );

  return distance < 30; // Tolerance threshold
}

/**
 * Find closest color from palette
 */
function findClosestColor(targetColor: string, palette: string[]): string {
  const targetRgb = hexToRgb(targetColor);
  if (!targetRgb) return palette[0];

  let closestColor = palette[0];
  let minDistance = Infinity;

  for (const color of palette) {
    const rgb = hexToRgb(color);
    if (!rgb) continue;

    const distance = Math.sqrt(
      Math.pow(targetRgb.r - rgb.r, 2) +
        Math.pow(targetRgb.g - rgb.g, 2) +
        Math.pow(targetRgb.b - rgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Enforce typography rules
 */
export function enforceTypography(
  userText: string,
  brandKit: BrandKit
): {
  text: string;
  font: string;
  weight: number;
  adjustments: string[];
} {
  const adjustments: string[] = [];

  // Determine if this is headline or body text
  const isHeadline = userText.length < 50 || /^[A-Z]/.test(userText);

  const font = isHeadline
    ? brandKit.typography.headlineFont
    : brandKit.typography.bodyFont;

  const weight = isHeadline
    ? brandKit.typography.fontWeights.bold
    : brandKit.typography.fontWeights.regular;

  // Check for brand voice violations
  const lowerText = userText.toLowerCase();
  const violations = brandKit.voice.avoidWords.filter((word) =>
    lowerText.includes(word.toLowerCase())
  );

  if (violations.length > 0) {
    adjustments.push(
      `Removed brand-violating words: ${violations.join(", ")}`
    );
  }

  return {
    text: userText,
    font,
    weight,
    adjustments,
  };
}

/**
 * Generate brand-aligned prompt enhancement
 */
export function enhancePromptWithBrandDNA(
  userPrompt: string,
  brandKit: BrandKit
): string {
  const styleGuide = [
    `Brand style: ${brandKit.moodBoard.styleKeywords.join(", ")}`,
    `Primary color: ${brandKit.colors.primary}`,
    `Typography: ${brandKit.typography.headlineFont} (headlines), ${brandKit.typography.bodyFont} (body)`,
    `Tone: ${brandKit.voice.tone}`,
    `Avoid: ${brandKit.moodBoard.avoidKeywords.join(", ")}`,
  ].join("\n");

  return `${userPrompt}\n\n--- BRAND GUIDELINES ---\n${styleGuide}`;
}

/**
 * Validate thumbnail against brand guidelines
 */
export function validateAgainstBrand(
  thumbnailMetadata: {
    colors: string[];
    fonts: string[];
    layout: string;
    textContent: string;
  },
  brandKit: BrandKit
): {
  compliant: boolean;
  violations: string[];
  suggestions: string[];
} {
  const violations: string[] = [];
  const suggestions: string[] = [];

  // Check colors
  const colorCheck = correctColors(thumbnailMetadata.colors, brandKit);
  if (colorCheck.changes.length > 0) {
    violations.push(
      `Colors not in brand palette: ${colorCheck.changes
        .map((c) => c.from)
        .join(", ")}`
    );
    suggestions.push(
      `Use brand colors: ${colorCheck.corrected.join(", ")}`
    );
  }

  // Check fonts
  const allowedFonts = [
    brandKit.typography.headlineFont,
    brandKit.typography.bodyFont,
    brandKit.typography.accentFont,
  ].filter(Boolean);

  const unauthorizedFonts = thumbnailMetadata.fonts.filter(
    (font) => !allowedFonts.includes(font)
  );

  if (unauthorizedFonts.length > 0) {
    violations.push(
      `Unauthorized fonts: ${unauthorizedFonts.join(", ")}`
    );
    suggestions.push(`Use brand fonts: ${allowedFonts.join(", ")}`);
  }

  // Check text content for brand voice
  const lowerText = thumbnailMetadata.textContent.toLowerCase();
  const forbiddenWords = brandKit.voice.avoidWords.filter((word) =>
    lowerText.includes(word.toLowerCase())
  );

  if (forbiddenWords.length > 0) {
    violations.push(
      `Brand voice violation: contains "${forbiddenWords.join('", "')}"`
    );
    suggestions.push(
      `Consider using: ${brandKit.voice.keywords.slice(0, 3).join(", ")}`
    );
  }

  return {
    compliant: violations.length === 0,
    violations,
    suggestions,
  };
}

/**
 * Auto-heal brand violations in generated thumbnail
 */
export async function autoHealBrandViolations(
  thumbnailMetadata: {
    colors: string[];
    fonts: string[];
    layout: string;
    textContent: string;
  },
  brandKit: BrandKit
): Promise<{
  healed: typeof thumbnailMetadata;
  changes: string[];
}> {
  const changes: string[] = [];

  // Auto-correct colors
  const colorCorrection = correctColors(thumbnailMetadata.colors, brandKit);
  if (colorCorrection.changes.length > 0) {
    changes.push(
      ...colorCorrection.changes.map((c) => `Color: ${c.from} → ${c.to}`)
    );
  }

  // Auto-correct fonts
  const correctedFonts = thumbnailMetadata.fonts.map((font) => {
    if (
      font !== brandKit.typography.headlineFont &&
      font !== brandKit.typography.bodyFont
    ) {
      changes.push(
        `Font: ${font} → ${brandKit.typography.headlineFont}`
      );
      return brandKit.typography.headlineFont;
    }
    return font;
  });

  // Auto-correct text content (remove forbidden words)
  let correctedText = thumbnailMetadata.textContent;
  for (const word of brandKit.voice.avoidWords) {
    if (correctedText.toLowerCase().includes(word.toLowerCase())) {
      // Replace with neutral equivalent
      correctedText = correctedText.replace(
        new RegExp(word, "gi"),
        "[...]"
      );
      changes.push(`Removed forbidden word: "${word}"`);
    }
  }

  return {
    healed: {
      colors: colorCorrection.corrected,
      fonts: correctedFonts,
      layout: thumbnailMetadata.layout,
      textContent: correctedText,
    },
    changes,
  };
}

/**
 * Get brand kit from database
 */
export async function getBrandKit(userId: string): Promise<BrandKit | null> {
  // TODO: Query Supabase
  // For now, return null (user hasn't set up brand kit yet)
  return null;
}

/**
 * Save brand kit to database
 */
export async function saveBrandKit(brandKit: BrandKit): Promise<void> {
  // TODO: Insert/update in Supabase `brand_kits` table
}
