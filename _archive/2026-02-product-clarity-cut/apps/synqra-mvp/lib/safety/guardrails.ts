/**
 * ============================================================
 * SAFETY GUARDRAILS
 * ============================================================
 * Hallucination detection, dual-pass validation, and safety checks
 */

import { AgentResponse, SafetyCheckResult } from "../agents/base/types";
import { agentConfig } from "../agents/base/config";

/**
 * Patterns that indicate potential hallucinations or unsafe responses
 */
const HALLUCINATION_PATTERNS = [
  /I (can|will) access your (database|files|account)/i,
  /I (have|just) (deleted|modified|updated) your/i,
  /your password is/i,
  /I (can see|am viewing) your (personal|private)/i,
  /I (have|just) (charged|billed) your/i,
  /I (have|can) transfer \$[\d,]+/i,
  /confirmed payment of \$[\d,]+/i,
  /I've (created|opened) a (ticket|case|incident) #\d+/i, // Unless it's actually created
];

/**
 * Unsafe content patterns
 */
const UNSAFE_PATTERNS = [
  /here is your (password|api key|secret|token):/i,
  /\b(sk-[a-zA-Z0-9]{32,})\b/, // API key pattern
  /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b.*password/i, // Email + password
  /(credit card|card number).*\d{4}/i,
];

/**
 * Confidence indicators (phrases that lower confidence)
 */
const LOW_CONFIDENCE_PHRASES = [
  "i think",
  "i believe",
  "maybe",
  "might be",
  "possibly",
  "not sure",
  "i guess",
  "perhaps",
];

/**
 * High confidence indicators
 */
const HIGH_CONFIDENCE_PHRASES = [
  "according to our documentation",
  "as stated in",
  "officially",
  "definitely",
  "confirmed",
  "verified",
];

/**
 * Check response for hallucinations
 */
export function checkForHallucinations(response: AgentResponse): SafetyCheckResult {
  const content = response.answer.toLowerCase();
  const flags: string[] = [];

  // Check for hallucination patterns
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(response.answer)) {
      flags.push(`Potential hallucination: ${pattern.source}`);
    }
  }

  // Check if claiming actions without evidence
  const actionClaims = [
    /I (have|just) (created|sent|updated|deleted|modified)/i,
    /successfully (created|sent|updated|deleted|modified)/i,
  ];

  for (const pattern of actionClaims) {
    if (pattern.test(response.answer)) {
      // Check if there's evidence (tool calls, metadata)
      if (!response.toolCalls || response.toolCalls.length === 0) {
        flags.push("Claims action without tool call evidence");
      }
    }
  }

  // Check confidence alignment
  if (response.confidence > 0.8) {
    const hasLowConfidencePhrase = LOW_CONFIDENCE_PHRASES.some((phrase) =>
      content.includes(phrase)
    );
    if (hasLowConfidencePhrase) {
      flags.push("High confidence score but uncertain language");
    }
  }

  const passed = flags.length === 0;

  return {
    passed,
    confidence: passed ? 0.9 : 0.4,
    flags,
    reason: passed
      ? "No hallucination detected"
      : "Potential hallucination or unsupported claims detected",
  };
}

/**
 * Check response for unsafe content
 */
export function checkForUnsafeContent(response: AgentResponse): SafetyCheckResult {
  const flags: string[] = [];

  // Check for unsafe patterns
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(response.answer)) {
      flags.push(`Unsafe content detected: ${pattern.source}`);
    }
  }

  // Check for PII leakage
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
  ];

  for (const pattern of piiPatterns) {
    if (pattern.test(response.answer)) {
      flags.push("Potential PII leakage detected");
    }
  }

  const passed = flags.length === 0;

  return {
    passed,
    confidence: passed ? 0.95 : 0.2,
    flags,
    reason: passed ? "No unsafe content detected" : "Unsafe content detected",
  };
}

/**
 * Validate response confidence score
 */
export function validateConfidence(response: AgentResponse): SafetyCheckResult {
  const content = response.answer.toLowerCase();
  const flags: string[] = [];

  // Count confidence indicators
  let positiveIndicators = 0;
  let negativeIndicators = 0;

  for (const phrase of HIGH_CONFIDENCE_PHRASES) {
    if (content.includes(phrase)) positiveIndicators++;
  }

  for (const phrase of LOW_CONFIDENCE_PHRASES) {
    if (content.includes(phrase)) negativeIndicators++;
  }

  // Check if confidence score aligns with language
  if (response.confidence > 0.8 && negativeIndicators > positiveIndicators) {
    flags.push("Confidence score too high for uncertain language");
  }

  if (response.confidence < 0.5 && positiveIndicators > negativeIndicators) {
    flags.push("Confidence score too low for certain language");
  }

  // Check if sources support confidence
  if (response.confidence > 0.8 && (!response.sources || response.sources.length === 0)) {
    flags.push("High confidence without supporting sources");
  }

  const passed = flags.length === 0;

  return {
    passed,
    confidence: passed ? 0.85 : 0.6,
    flags,
    reason: passed
      ? "Confidence score is well-calibrated"
      : "Confidence score may be miscalibrated",
  };
}

/**
 * Comprehensive safety check
 */
export function performSafetyCheck(response: AgentResponse): {
  safe: boolean;
  checks: {
    hallucination: SafetyCheckResult;
    unsafe: SafetyCheckResult;
    confidence: SafetyCheckResult;
  };
  overallConfidence: number;
  recommendation: "allow" | "review" | "block";
} {
  const hallucinationCheck = checkForHallucinations(response);
  const unsafeCheck = checkForUnsafeContent(response);
  const confidenceCheck = validateConfidence(response);

  const allPassed =
    hallucinationCheck.passed && unsafeCheck.passed && confidenceCheck.passed;

  // Calculate overall confidence
  const overallConfidence =
    (hallucinationCheck.confidence +
      unsafeCheck.confidence +
      confidenceCheck.confidence) /
    3;

  // Determine recommendation
  let recommendation: "allow" | "review" | "block";
  if (!unsafeCheck.passed) {
    recommendation = "block";
  } else if (!hallucinationCheck.passed) {
    recommendation = "review";
  } else if (!confidenceCheck.passed) {
    recommendation = "review";
  } else {
    recommendation = "allow";
  }

  return {
    safe: allPassed,
    checks: {
      hallucination: hallucinationCheck,
      unsafe: unsafeCheck,
      confidence: confidenceCheck,
    },
    overallConfidence,
    recommendation,
  };
}

/**
 * Dual-pass validation: compare two responses for consistency
 */
export function dualPassValidation(
  response1: AgentResponse,
  response2: AgentResponse
): {
  consistent: boolean;
  similarity: number;
  discrepancies: string[];
} {
  const discrepancies: string[] = [];

  // Compare confidence scores
  const confidenceDiff = Math.abs(response1.confidence - response2.confidence);
  if (confidenceDiff > 0.3) {
    discrepancies.push(
      `Large confidence difference: ${confidenceDiff.toFixed(2)}`
    );
  }

  // Compare answer lengths
  const length1 = response1.answer.length;
  const length2 = response2.answer.length;
  const lengthRatio = Math.max(length1, length2) / Math.min(length1, length2);
  if (lengthRatio > 2) {
    discrepancies.push(`Significant length difference: ${lengthRatio.toFixed(2)}x`);
  }

  // Simple word-based similarity
  const words1 = new Set(
    response1.answer.toLowerCase().split(/\s+/)
  );
  const words2 = new Set(
    response2.answer.toLowerCase().split(/\s+/)
  );

  const intersection = new Set(
    [...words1].filter((word) => words2.has(word))
  );
  const union = new Set([...words1, ...words2]);

  const similarity = intersection.size / union.size;

  if (similarity < 0.3) {
    discrepancies.push(`Low semantic similarity: ${(similarity * 100).toFixed(0)}%`);
  }

  return {
    consistent: discrepancies.length === 0,
    similarity,
    discrepancies,
  };
}

/**
 * Apply safety guardrails to agent response
 */
export function applySafetyGuardrails(
  response: AgentResponse
): {
  response: AgentResponse;
  safetyReport: ReturnType<typeof performSafetyCheck>;
} {
  // Skip if safety checks are disabled
  if (!agentConfig.safety.hallucinationCheck) {
    return {
      response,
      safetyReport: {
        safe: true,
        checks: {
          hallucination: {
            passed: true,
            confidence: 1,
            flags: [],
            reason: "Safety checks disabled",
          },
          unsafe: {
            passed: true,
            confidence: 1,
            flags: [],
            reason: "Safety checks disabled",
          },
          confidence: {
            passed: true,
            confidence: 1,
            flags: [],
            reason: "Safety checks disabled",
          },
        },
        overallConfidence: 1,
        recommendation: "allow",
      },
    };
  }

  const safetyReport = performSafetyCheck(response);

  // Modify response based on safety check
  let modifiedResponse = { ...response };

  if (safetyReport.recommendation === "block") {
    modifiedResponse = {
      answer:
        "I apologize, but I'm unable to provide that information for safety reasons. Please contact our support team directly for assistance with sensitive account matters.",
      confidence: 0.9,
      sources: ["/support/contact"],
      reasoning: "Response blocked by safety guardrails",
      metadata: {
        ...response.metadata,
        safetyBlocked: true,
        safetyReason: safetyReport.checks.unsafe.reason,
      },
    };
  } else if (safetyReport.recommendation === "review") {
    // Add disclaimer to response
    modifiedResponse.answer += `\n\n_Note: Please verify this information with our official documentation or support team to ensure accuracy._`;

    // Lower confidence
    modifiedResponse.confidence = Math.min(
      modifiedResponse.confidence,
      safetyReport.overallConfidence
    );

    modifiedResponse.metadata = {
      ...response.metadata,
      safetyReview: true,
      safetyFlags: [
        ...safetyReport.checks.hallucination.flags,
        ...safetyReport.checks.confidence.flags,
      ],
    };
  }

  return {
    response: modifiedResponse,
    safetyReport,
  };
}
