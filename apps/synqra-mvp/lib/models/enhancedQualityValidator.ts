/**
 * ============================================================
 * ENHANCED QUALITY VALIDATOR - DEEPSEEK ARCHITECTURE
 * ============================================================
 * Combines relevance scoring, brand DNA, and hallucination detection
 * Uses cross-encoder reranking for quality assurance
 */

import { runInference } from "./localModelLoader";
import { checkBrandConsistency } from "./brandDNAValidator";
import { verifyAllClaims, detectHallucinationPatterns } from "./hallucinationGate";
import { QualityValidation } from "./types";

/**
 * Comprehensive quality validation
 */
export async function validateOutputQuality(
  input: string,
  output: string,
  context: string,
  options: {
    modelId: string;
    requiresBrand?: boolean;
    brandId?: "noid" | "synqra" | "aurafx" | "de-bear";
    checkHallucinations?: boolean;
  }
): Promise<QualityValidation & {
  relevanceScore: number;
  brandScore: number;
  hallucinationScore: number;
  detailedIssues: string[];
}> {
  console.log("🔍 Running comprehensive quality validation...");
  
  const {
    modelId,
    requiresBrand = false,
    brandId = "de-bear",
    checkHallucinations = true,
  } = options;
  
  // Step 1: Relevance scoring using cross-encoder (MiniLM-L12-v2)
  const relevanceScore = await scoreRelevanceWithCrossEncoder(input, output);
  console.log(`   📊 Relevance: ${(relevanceScore * 100).toFixed(1)}%`);
  
  // Step 2: Brand DNA check
  let brandScore = 0.75; // Default neutral
  let brandIssues: string[] = [];
  
  if (requiresBrand) {
    const brandCheck = await checkBrandConsistency(output, brandId);
    brandScore = brandCheck.score;
    
    if (brandCheck.violations.length > 0) {
      brandIssues.push(`Brand violations: ${brandCheck.violations.join(", ")}`);
    }
    
    console.log(`   🎨 Brand: ${(brandScore * 100).toFixed(1)}% (${brandId})`);
  }
  
  // Step 3: Hallucination detection
  let hallucinationScore = 1.0; // 1.0 = no hallucinations
  let hallucinationIssues: string[] = [];
  
  if (checkHallucinations && context) {
    // Check for hallucination patterns
    const patterns = detectHallucinationPatterns(output);
    if (patterns.hasPatterns) {
      hallucinationIssues.push(...patterns.patterns);
      hallucinationScore -= 0.1 * patterns.patterns.length;
    }
    
    // Verify factual claims
    const claimVerification = await verifyAllClaims(context, output);
    if (!claimVerification.allGrounded) {
      hallucinationScore -= 0.2 * (1 - claimVerification.groundedCount / claimVerification.totalClaims);
      hallucinationIssues.push(
        `Ungrounded claims (${claimVerification.ungroundedClaims.length}): ${claimVerification.ungroundedClaims.slice(0, 2).join(", ")}`
      );
    }
    
    console.log(`   🔍 Hallucination: ${(hallucinationScore * 100).toFixed(1)}%`);
  }
  
  // Step 4: Calculate overall score
  const weights = {
    relevance: requiresBrand ? 0.35 : 0.50,
    brand: requiresBrand ? 0.35 : 0.15,
    hallucination: 0.30,
  };
  
  const overallScore = 
    relevanceScore * weights.relevance +
    brandScore * weights.brand +
    hallucinationScore * weights.hallucination;
  
  // Step 5: Determine action
  let action: "deliver" | "rephrase" | "escalate";
  if (overallScore >= 0.8 && hallucinationScore >= 0.7) {
    action = "deliver";
  } else if (overallScore >= 0.6 && hallucinationScore >= 0.5) {
    action = "rephrase";
  } else {
    action = "escalate";
  }
  
  // Step 6: Collect all issues
  const detailedIssues: string[] = [];
  
  if (relevanceScore < 0.7) {
    detailedIssues.push(`Low relevance: ${(relevanceScore * 100).toFixed(1)}%`);
  }
  
  if (requiresBrand && brandScore < 0.7) {
    detailedIssues.push(`Brand misalignment: ${(brandScore * 100).toFixed(1)}%`);
    detailedIssues.push(...brandIssues);
  }
  
  if (hallucinationScore < 0.8) {
    detailedIssues.push(`Hallucination risk: ${((1 - hallucinationScore) * 100).toFixed(1)}%`);
    detailedIssues.push(...hallucinationIssues);
  }
  
  // Step 7: Generate suggestions
  const suggestions: string[] = [];
  if (action === "rephrase") {
    if (relevanceScore < 0.75) {
      suggestions.push("Focus more directly on the user's question");
    }
    if (brandScore < 0.75 && requiresBrand) {
      suggestions.push(`Adjust tone to match ${brandId} brand DNA`);
    }
    if (hallucinationScore < 0.85) {
      suggestions.push("Remove or qualify unsupported claims");
    }
  }
  
  console.log(`   ✅ Overall: ${(overallScore * 100).toFixed(1)}% → ${action.toUpperCase()}`);
  
  return {
    score: overallScore,
    passed: action === "deliver",
    action,
    issues: detailedIssues,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    relevanceScore,
    brandScore,
    hallucinationScore,
    detailedIssues,
  };
}

/**
 * Score relevance using cross-encoder (MiniLM-L12-v2)
 */
async function scoreRelevanceWithCrossEncoder(
  query: string,
  response: string
): Promise<number> {
  try {
    // Use MiniLM-L12-v2 as cross-encoder for reranking
    const result = await runInference({
      modelId: "minilm-l12-v2",
      input: `Query: ${query}\n\nResponse: ${response}`,
      options: {},
    });
    
    // Extract score (0-1)
    const score = Array.isArray(result.output) 
      ? result.output[0]
      : 0.75; // Default fallback
    
    return Math.max(0, Math.min(1, score));
  } catch (error) {
    console.error("Cross-encoder scoring failed, using heuristic");
    
    // Fallback to simple heuristic
    return scoreRelevanceHeuristic(query, response);
  }
}

/**
 * Heuristic relevance scoring (fallback)
 */
function scoreRelevanceHeuristic(query: string, response: string): number {
  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();
  
  // Extract keywords from query
  const queryWords = queryLower
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Count matches
  const matches = queryWords.filter(word => 
    responseLower.includes(word)
  ).length;
  
  // Calculate score
  const matchRatio = queryWords.length > 0 
    ? matches / queryWords.length 
    : 0.5;
  
  // Adjust for response length
  const lengthPenalty = response.length < 50 ? 0.1 : 0;
  const lengthBonus = response.length > 100 && response.length < 800 ? 0.1 : 0;
  
  return Math.max(0, Math.min(1, matchRatio + lengthBonus - lengthPenalty));
}

/**
 * Quick validation check (for fast filtering)
 */
export async function quickValidate(
  output: string,
  options: {
    minLength?: number;
    maxLength?: number;
    requiresBrand?: boolean;
  } = {}
): Promise<{
  passed: boolean;
  reason?: string;
}> {
  const {
    minLength = 20,
    maxLength = 5000,
    requiresBrand = false,
  } = options;
  
  // Length check
  if (output.length < minLength) {
    return { passed: false, reason: "Output too short" };
  }
  
  if (output.length > maxLength) {
    return { passed: false, reason: "Output too long" };
  }
  
  // Quick toxicity check (keyword-based)
  const toxicKeywords = ["hate", "kill", "die", "stupid", "idiot"];
  const hasToxic = toxicKeywords.some(k => output.toLowerCase().includes(k));
  if (hasToxic) {
    return { passed: false, reason: "Toxic content detected" };
  }
  
  // Quick brand check if required
  if (requiresBrand) {
    const hasCapital = /[A-Z]/.test(output);
    const hasPunctuation = /[.!?]/.test(output);
    
    if (!hasCapital || !hasPunctuation) {
      return { passed: false, reason: "Poor formatting" };
    }
  }
  
  return { passed: true };
}
