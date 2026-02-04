import { validateBrandVoice, enforceBrandTerminology } from "@/lib/brand/synqra-voice";

const BLOCKED_PHRASES = [
  "guaranteed",
  "you should",
  "buy now",
  "can't lose",
  "will definitely",
  "must act now",
  "limited time",
  "don't miss out",
  "as an ai",
  "i'm here to help",
  "let me assist you",
  "happy to help",
  "you might want to",
  "it's recommended",
  "consider doing",
  "sell now",
  "invest in",
  "guaranteed returns",
];

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  processed?: string;
}

/**
 * Validate output against security and brand guidelines
 */
export function validateOutput(
  text: string,
  options?: {
    brand?: "synqra" | "noid" | "aurafx";
    enforceBrand?: boolean;
  }
): ValidationResult {
  const violations: string[] = [];
  const lowered = text.toLowerCase();
  
  // Check for prohibited phrases (security)
  for (const phrase of BLOCKED_PHRASES) {
    if (lowered.includes(phrase)) {
      violations.push(`Contains prohibited phrase: "${phrase}"`);
    }
  }
  
  // Check brand voice compliance
  if (options?.brand) {
    const brandCheck = validateBrandVoice(text, options.brand);
    if (!brandCheck.valid) {
      violations.push(...brandCheck.violations);
    }
  }
  
  // If validation fails, throw error
  if (violations.length > 0) {
    const error = new Error(`Output blocked: ${violations.join("; ")}`);
    (error as any).violations = violations;
    throw error;
  }
  
  // Optionally enforce brand terminology
  let processed = text;
  if (options?.enforceBrand && options?.brand) {
    processed = enforceBrandTerminology(text, options.brand);
  }
  
  return {
    valid: true,
    violations: [],
    processed,
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use validateOutput() with options instead
 */
export function validateOutputLegacy(text: string): void {
  validateOutput(text);
}
