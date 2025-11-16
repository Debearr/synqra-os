/**
 * ============================================================
 * PRODUCT ROUTER
 * ============================================================
 * Routes commenters to correct product (Synqra/NØID/AuraFX)
 * 
 * RPRD DNA: Intelligent, precise, helpful
 */

import type { ProductFit } from "./types";

/**
 * Product-specific keywords
 */
const PRODUCT_KEYWORDS = {
  synqra: [
    // Core features
    "content", "social media", "post", "posting", "schedule", "scheduling",
    "linkedin", "twitter", "instagram", "tiktok", "youtube",
    
    // User types
    "creator", "content creator", "influencer", "brand", "agency",
    "marketing", "social media manager", "copywriter",
    
    // Use cases
    "automate content", "generate posts", "brand voice", "ai writing",
    "content automation", "social automation", "newsletter",
    
    // Pain points
    "too much time posting", "content consistency", "brand consistency",
  ],

  noid: [
    // Core features
    "driver", "gig", "delivery", "courier", "mileage", "miles",
    "expenses", "deductions", "taxes", "tracking",
    
    // Platforms
    "uber", "lyft", "doordash", "grubhub", "instacart", "postmates",
    
    // User types
    "driver", "gig worker", "delivery driver", "rideshare",
    
    // Use cases
    "track mileage", "tax deductions", "expense tracking",
    "driver tools", "gig tools",
    
    // Pain points
    "manual tracking", "miss deductions", "tax time nightmare",
  ],

  aurafx: [
    // Core features
    "trading", "signals", "strategy", "analysis", "backtest",
    "risk management", "portfolio", "alerts",
    
    // Markets
    "forex", "crypto", "stocks", "futures", "options",
    "bitcoin", "ethereum", "trading pairs",
    
    // User types
    "trader", "prop firm", "institutional", "professional trader",
    "day trader", "swing trader", "scalper",
    
    // Use cases
    "trading signals", "signal provider", "trade analysis",
    "risk calculator", "performance tracking",
    
    // Pain points
    "losing trades", "risk management", "emotion", "discipline",
  ],
};

/**
 * Determine product fit from comment text
 */
export function determineProductFit(text: string): {
  productFit: ProductFit;
  confidence: number; // 0-100
  reasoning: string;
  detectedKeywords: string[];
} {
  const lower = text.toLowerCase();
  const scores: Record<"synqra" | "noid" | "aurafx", number> = {
    synqra: 0,
    noid: 0,
    aurafx: 0,
  };

  const detectedKeywords: Record<"synqra" | "noid" | "aurafx", string[]> = {
    synqra: [],
    noid: [],
    aurafx: [],
  };

  // Score each product based on keyword matches
  for (const [product, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        scores[product as keyof typeof scores]++;
        detectedKeywords[product as keyof typeof detectedKeywords].push(keyword);
      }
    }
  }

  // Determine best fit
  const maxScore = Math.max(scores.synqra, scores.noid, scores.aurafx);

  if (maxScore === 0) {
    return {
      productFit: "unclear",
      confidence: 0,
      reasoning: "No product-specific keywords detected",
      detectedKeywords: [],
    };
  }

  let productFit: ProductFit = "unclear";
  if (scores.synqra === maxScore) productFit = "synqra";
  else if (scores.noid === maxScore) productFit = "noid";
  else if (scores.aurafx === maxScore) productFit = "aurafx";

  // Calculate confidence (0-100)
  const confidence = Math.min(100, maxScore * 15); // ~7 keywords = 100% confidence

  // Build reasoning
  const keywords = detectedKeywords[productFit as keyof typeof detectedKeywords];
  const reasoning = keywords.length > 0
    ? `Detected ${productFit.toUpperCase()} keywords: ${keywords.slice(0, 3).join(", ")}`
    : "No strong product match";

  return {
    productFit: productFit === "unclear" ? "none" : productFit,
    confidence,
    reasoning,
    detectedKeywords: keywords,
  };
}

/**
 * Get product description for reply context
 */
export function getProductDescription(product: ProductFit): string {
  const descriptions = {
    synqra: "Synqra automates content creation for creators, brands, and agencies. Generates LinkedIn posts, Twitter threads, and newsletters that match your voice.",
    noid: "NØID helps gig drivers track mileage, expenses, and tax deductions automatically. Built for Uber, DoorDash, and delivery drivers.",
    aurafx: "AuraFX provides trading signals, risk analysis, and performance tracking for traders and prop firms. Institutional-grade intelligence.",
    unclear: "NØID Labs builds AI tools for creators (Synqra), drivers (NØID), and traders (AuraFX).",
    none: "NØID Labs builds AI tools for creators, drivers, and traders.",
  };

  return descriptions[product] || descriptions.none;
}

/**
 * Get product CTA
 */
export function getProductCTA(product: ProductFit): string {
  const ctas = {
    synqra: "Try Synqra free: synqra.app",
    noid: "Try NØID free: noid.app",
    aurafx: "Try AuraFX: aurafx.ai",
    unclear: "Explore NØID Labs: noidlabs.com",
    none: "Learn more: noidlabs.com",
  };

  return ctas[product] || ctas.none;
}

/**
 * Check if user mentions multiple products (cross-sell opportunity)
 */
export function detectCrossSellOpportunity(text: string): {
  hasCrossSell: boolean;
  products: ProductFit[];
  reasoning: string;
} {
  const fits: ProductFit[] = [];

  const synqraFit = determineProductFit(text);
  if (synqraFit.productFit === "synqra" && synqraFit.confidence >= 50) {
    fits.push("synqra");
  }

  const noidFit = determineProductFit(text);
  if (noidFit.productFit === "noid" && noidFit.confidence >= 50) {
    fits.push("noid");
  }

  const aurafxFit = determineProductFit(text);
  if (aurafxFit.productFit === "aurafx" && aurafxFit.confidence >= 50) {
    fits.push("aurafx");
  }

  const hasCrossSell = fits.length > 1;
  const reasoning = hasCrossSell
    ? `User mentions multiple products: ${fits.join(", ")}`
    : "Single product focus";

  return {
    hasCrossSell,
    products: fits,
    reasoning,
  };
}
