/**
 * ============================================================
 * BRAND DNA VALIDATOR
 * ============================================================
 * Uses OpenCLIP to validate brand consistency
 * Checks output against RPRD DNA standards
 */

import { runInference } from "./localModelLoader";

/**
 * Brand DNA profiles
 */
const BRAND_DNA_PROFILES = {
  "noid": {
    name: "NØID",
    description: "Driver assistant - efficient, professional, helpful",
    keywords: ["efficient", "reliable", "professional", "helpful", "driver", "schedule"],
    tone: "direct and supportive",
    avoidWords: ["luxury", "premium", "exclusive"],
  },
  "synqra": {
    name: "Synqra",
    description: "Content engine - creative, premium, intelligent",
    keywords: ["creative", "premium", "intelligent", "content", "automation", "multi-platform"],
    tone: "confident and innovative",
    avoidWords: ["cheap", "basic", "simple"],
  },
  "aurafx": {
    name: "AuraFX",
    description: "Trading assistant - precise, analytical, disciplined",
    keywords: ["precise", "analytical", "disciplined", "trading", "risk", "signals"],
    tone: "authoritative and measured",
    avoidWords: ["guaranteed", "easy money", "get rich"],
  },
  "de-bear": {
    name: "De Bear Personal Brand",
    description: "RPRD DNA - Refined, Premium, Rebellious, Disruptive",
    keywords: ["refined", "premium", "rebellious", "disruptive", "innovative", "bold"],
    tone: "confident with subtle edge",
    avoidWords: ["traditional", "boring", "safe", "conventional"],
  },
};

/**
 * RPRD DNA markers
 */
const RPRD_DNA = {
  refined: ["clarity", "precision", "clean", "elegant", "sophisticated"],
  premium: ["luxury", "executive", "professional", "high-quality", "elite"],
  rebellious: ["bold", "challenge", "innovative", "different", "unique"],
  disruptive: ["transform", "revolutionize", "breakthrough", "cutting-edge", "advanced"],
};

/**
 * Check brand consistency using text analysis
 */
export async function checkBrandConsistency(
  output: string,
  brandId: keyof typeof BRAND_DNA_PROFILES = "de-bear"
): Promise<{
  score: number;
  matches: string[];
  violations: string[];
  recommendation: string;
}> {
  const profile = BRAND_DNA_PROFILES[brandId];
  const outputLower = output.toLowerCase();
  
  // Check for positive brand markers
  const matches = profile.keywords.filter(keyword =>
    outputLower.includes(keyword.toLowerCase())
  );
  
  // Check for violations (avoid words)
  const violations = profile.avoidWords.filter(word =>
    outputLower.includes(word.toLowerCase())
  );
  
  // Calculate base score
  let score = 0.5; // Neutral baseline
  
  // Add points for matches
  score += Math.min(matches.length * 0.1, 0.3);
  
  // Subtract points for violations
  score -= violations.length * 0.15;
  
  // Check RPRD DNA markers if De Bear brand
  if (brandId === "de-bear") {
    let rprdScore = 0;
    
    for (const [category, markers] of Object.entries(RPRD_DNA)) {
      const categoryMatches = markers.filter(marker =>
        outputLower.includes(marker.toLowerCase())
      ).length;
      
      rprdScore += categoryMatches * 0.05;
    }
    
    score += Math.min(rprdScore, 0.2);
  }
  
  // Check tone appropriateness (simple heuristics)
  const exclamationCount = (output.match(/!/g) || []).length;
  const questionCount = (output.match(/\?/g) || []).length;
  const avgSentenceLength = output.split(/[.!?]+/).reduce((sum, s) => sum + s.length, 0) / 
                            Math.max(output.split(/[.!?]+/).length, 1);
  
  // Adjust for tone
  if (brandId === "noid" && avgSentenceLength > 150) {
    score -= 0.1; // NOID should be concise
  }
  
  if (brandId === "synqra" && exclamationCount > 5) {
    score -= 0.15; // Synqra should be measured, not overly excited
  }
  
  if (brandId === "aurafx" && exclamationCount > 2) {
    score -= 0.2; // AuraFX must be calm and professional
  }
  
  // Clamp score
  score = Math.max(0, Math.min(1, score));
  
  // Generate recommendation
  let recommendation = "";
  if (score < 0.6) {
    recommendation = `Low brand alignment. Consider: ${profile.tone} tone`;
    if (violations.length > 0) {
      recommendation += `. Remove: ${violations.join(", ")}`;
    }
    if (matches.length < 2) {
      recommendation += `. Add keywords: ${profile.keywords.slice(0, 3).join(", ")}`;
    }
  } else if (score < 0.8) {
    recommendation = `Good alignment, minor improvements possible`;
  } else {
    recommendation = `Excellent brand consistency`;
  }
  
  return {
    score,
    matches,
    violations,
    recommendation,
  };
}

/**
 * Check brand consistency using OpenCLIP (style embeddings)
 */
export async function checkBrandConsistencyWithVision(
  outputImageOrText: string | Buffer,
  brandId: keyof typeof BRAND_DNA_PROFILES = "de-bear"
): Promise<{
  score: number;
  styleMatch: number;
  recommendation: string;
}> {
  console.log(`🎨 Checking brand consistency for: ${brandId}`);
  
  try {
    // Generate style embedding for output
    const outputEmbedding = await runInference({
      modelId: "openclip-vit-b-32",
      input: outputImageOrText,
      options: {},
    });
    
    // For now, return text-based check as fallback
    // In production, would compare embeddings against brand reference library
    if (typeof outputImageOrText === "string") {
      const result = await checkBrandConsistency(outputImageOrText, brandId);
      return {
        ...result,
        styleMatch: result.score, // Add missing styleMatch property
      };
    }
    
    // For images, use heuristic scoring
    return {
      score: 0.75, // Neutral for images without reference
      styleMatch: 0.75,
      recommendation: "Visual style check requires reference library",
    };
  } catch (error) {
    console.error("OpenCLIP check failed, falling back to text analysis");
    
    if (typeof outputImageOrText === "string") {
      const result = await checkBrandConsistency(outputImageOrText, brandId);
      return {
        ...result,
        styleMatch: result.score, // Add missing styleMatch property
      };
    }
    
    return {
      score: 0.5,
      styleMatch: 0.5,
      recommendation: "Unable to validate brand consistency",
    };
  }
}

/**
 * Get brand profile
 */
export function getBrandProfile(brandId: keyof typeof BRAND_DNA_PROFILES) {
  return BRAND_DNA_PROFILES[brandId];
}

/**
 * List all brand profiles
 */
export function getAllBrandProfiles() {
  return BRAND_DNA_PROFILES;
}
