/**
 * ============================================================
 * HALLUCINATION GATE
 * ============================================================
 * Verifies factual grounding before final output
 * Uses Llama 3.2 1B for fast verification
 */

import { runInference } from "./localModelLoader";

/**
 * Verify claim against context
 */
export async function verifyFactualGrounding(
  context: string,
  claim: string
): Promise<{
  isGrounded: boolean;
  confidence: number;
  reasoning: string;
}> {
  console.log("🔍 Verifying factual grounding...");
  
  // Construct verification prompt
  const verificationPrompt = `Context: ${context}

Claim: ${claim}

Question: Is this claim fully supported by the context above?

Answer with ONLY "YES" or "NO", followed by a brief reason.

Answer:`;
  
  try {
    // Use Llama 3.2 1B for verification
    const result = await runInference({
      modelId: "llama-3.2-1b",
      input: verificationPrompt,
      options: {
        maxTokens: 50,
        temperature: 0.1, // Low temperature for factual verification
      },
    });
    
    const response = String(result.output).trim().toUpperCase();
    
    // Parse response
    const isGrounded = response.startsWith("YES");
    const reasoning = String(result.output).substring(3).trim();
    
    // Calculate confidence based on response clarity
    let confidence = 0.7; // Base confidence
    
    if (response.startsWith("YES") || response.startsWith("NO")) {
      confidence = 0.85; // Clear answer
    }
    
    if (reasoning.length > 10) {
      confidence += 0.1; // Has reasoning
    }
    
    console.log(`   ${isGrounded ? "✅" : "❌"} Grounded: ${isGrounded}`);
    console.log(`   🎯 Confidence: ${(confidence * 100).toFixed(1)}%`);
    
    return {
      isGrounded,
      confidence,
      reasoning: reasoning || "No detailed reasoning provided",
    };
  } catch (error) {
    console.error("❌ Hallucination gate error:", error);
    
    // Default to cautious (not grounded)
    return {
      isGrounded: false,
      confidence: 0.3,
      reasoning: "Verification failed - treating as ungrounded for safety",
    };
  }
}

/**
 * Extract claims from text
 */
export function extractClaims(text: string): string[] {
  // Simple claim extraction (split by sentences)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  // Filter for factual-sounding claims
  const claims = sentences.filter(sentence => {
    const lower = sentence.toLowerCase();
    
    // Factual indicators
    const hasFactualIndicators = 
      /\d+/.test(sentence) ||                    // Contains numbers
      lower.includes("is") ||                    // Contains "is"
      lower.includes("are") ||                   // Contains "are"
      lower.includes("will") ||                  // Contains "will"
      lower.includes("can") ||                   // Contains "can"
      lower.includes("provides") ||              // Contains "provides"
      lower.includes("offers") ||                // Contains "offers"
      lower.includes("supports");                // Contains "supports"
    
    // Opinion indicators (exclude these)
    const hasOpinionIndicators =
      lower.includes("i think") ||
      lower.includes("in my opinion") ||
      lower.includes("i believe") ||
      lower.includes("might") ||
      lower.includes("perhaps");
    
    return hasFactualIndicators && !hasOpinionIndicators;
  });
  
  return claims;
}

/**
 * Verify all claims in text
 */
export async function verifyAllClaims(
  context: string,
  text: string
): Promise<{
  allGrounded: boolean;
  groundedCount: number;
  totalClaims: number;
  ungroundedClaims: string[];
  avgConfidence: number;
}> {
  console.log("🔍 Verifying all claims in text...");
  
  const claims = extractClaims(text);
  
  if (claims.length === 0) {
    console.log("   ℹ️  No factual claims detected");
    return {
      allGrounded: true,
      groundedCount: 0,
      totalClaims: 0,
      ungroundedClaims: [],
      avgConfidence: 1.0,
    };
  }
  
  console.log(`   📋 Found ${claims.length} factual claims to verify`);
  
  // Verify each claim
  const results = await Promise.all(
    claims.map(claim => verifyFactualGrounding(context, claim))
  );
  
  const groundedCount = results.filter(r => r.isGrounded).length;
  const ungroundedClaims = claims.filter((_, i) => !results[i].isGrounded);
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  console.log(`   ✅ Grounded: ${groundedCount}/${claims.length}`);
  console.log(`   🎯 Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  
  return {
    allGrounded: groundedCount === claims.length,
    groundedCount,
    totalClaims: claims.length,
    ungroundedClaims,
    avgConfidence,
  };
}

/**
 * Check for common hallucination patterns
 */
export function detectHallucinationPatterns(text: string): {
  hasPatterns: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];
  const lower = text.toLowerCase();
  
  // Specific number claims (often hallucinated)
  if (/\d{4,}/.test(text) && !lower.includes("year")) {
    patterns.push("Specific large numbers without year context");
  }
  
  // Exact percentages (often made up)
  if (/\d+\.\d+%/.test(text) && !lower.includes("approximately")) {
    patterns.push("Precise percentages without qualification");
  }
  
  // Definitive claims without hedging
  if (lower.includes("always") || lower.includes("never") || lower.includes("every")) {
    patterns.push("Absolute statements (always/never/every)");
  }
  
  // Unsupported authority
  if (lower.includes("studies show") || lower.includes("research indicates")) {
    patterns.push("Generic authority claims without citation");
  }
  
  // Future predictions stated as fact
  if (lower.includes("will definitely") || lower.includes("will certainly")) {
    patterns.push("Definitive future predictions");
  }
  
  return {
    hasPatterns: patterns.length > 0,
    patterns,
  };
}
