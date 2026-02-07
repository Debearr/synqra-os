/**
 * LUXGRID COLOR SYSTEM
 * 
 * Core color tokens for the LuxGrid OS ecosystem:
 * - NØID
 * - SYNQRA
 * - AuraFX
 * - NY7 Coffee
 * - Internal LuxGrid UI library
 * - Future theme packs (2025–2030 roadmap)
 * 
 * @version 1.0.0
 * @immutable All color values are frozen via `as const`
 */

export const luxgridColors = {
  primaryBlack: { hex: "#000000", rgb: "0, 0, 0" },
  goldAccent: { hex: "#D4AF37", rgb: "212, 175, 55" },
  emeraldAccent: { hex: "#00D9A3", rgb: "0, 217, 163" },
  pureWhite: { hex: "#FFFFFF", rgb: "255, 255, 255" },

  // Reserved for future theme evolution
  futureAccentA: { hex: null, rgb: null },
  futureAccentB: { hex: null, rgb: null },
} as const;

export type LuxgridColorKey = keyof typeof luxgridColors;

/**
 * Type-safe color accessor
 * @example
 * const gold = luxgridColors.goldAccent;
 * console.log(gold.hex); // "#D4AF37"
 */
export type LuxgridColor = {
  hex: string | null;
  rgb: string | null;
};
