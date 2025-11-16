/**
 * ============================================================
 * COMPLEXITY SCORING ENGINE
 * ============================================================
 * Determines task complexity to route to appropriate model
 */

import { TaskComplexity } from './types';

interface ComplexityHints {
  isClientFacing: boolean;
  hasStructuredOutput: boolean;
  requiresReasoning: boolean;
}

/**
 * SCORE TASK COMPLEXITY
 * Returns 0-1 score indicating how complex the task is
 */
export function scoreComplexity(
  input: string,
  hints: ComplexityHints
): TaskComplexity {
  const factors = {
    length: scoreLengthComplexity(input),
    structure: hints.hasStructuredOutput ? 0.2 : 0,
    reasoning: hints.requiresReasoning ? 0.3 : 0,
    clientFacing: hints.isClientFacing ? 0.15 : 0,
  };

  // Calculate weighted score
  const score = Math.min(
    factors.length +
    factors.structure +
    factors.reasoning +
    factors.clientFacing,
    1.0
  );

  // Generate reasoning
  const reasoning = generateReasoning(score, factors, hints);

  return {
    score,
    reasoning,
    factors: {
      length: factors.length,
      structureRequired: hints.hasStructuredOutput,
      reasoningDepth: hints.requiresReasoning ? 0.3 : 0,
      clientFacing: hints.isClientFacing,
    },
  };
}

/**
 * SCORE LENGTH COMPLEXITY
 */
function scoreLengthComplexity(input: string): number {
  const length = input.length;
  
  // Length scoring:
  // 0-200 chars: 0.1
  // 200-500: 0.2
  // 500-1000: 0.3
  // 1000-2000: 0.4
  // 2000+: 0.5
  
  if (length < 200) return 0.1;
  if (length < 500) return 0.2;
  if (length < 1000) return 0.3;
  if (length < 2000) return 0.4;
  return 0.5;
}

/**
 * GENERATE REASONING
 */
function generateReasoning(
  score: number,
  factors: any,
  hints: ComplexityHints
): string {
  const reasons: string[] = [];

  if (factors.length >= 0.4) {
    reasons.push('Long input requires deeper processing');
  }

  if (hints.hasStructuredOutput) {
    reasons.push('Structured output increases complexity');
  }

  if (hints.requiresReasoning) {
    reasons.push('Reasoning required for logic validation');
  }

  if (hints.isClientFacing) {
    reasons.push('Client-facing output requires premium quality');
  }

  if (score < 0.4) {
    return `Simple task (${score.toFixed(2)}): ${reasons.join(', ') || 'straightforward processing'}`;
  } else if (score < 0.7) {
    return `Moderate task (${score.toFixed(2)}): ${reasons.join(', ')}`;
  } else if (score < 0.85) {
    return `Complex task (${score.toFixed(2)}): ${reasons.join(', ')}`;
  } else {
    return `High-complexity task (${score.toFixed(2)}): ${reasons.join(', ')} - requires premium model`;
  }
}

/**
 * ANALYZE INPUT PATTERNS
 * Detects common patterns that indicate complexity
 */
export function analyzeInputPatterns(input: string): {
  hasCode: boolean;
  hasData: boolean;
  hasMultipleLanguages: boolean;
  questionCount: number;
  sentenceCount: number;
} {
  return {
    hasCode: /```|function|const|let|var|import/.test(input),
    hasData: /\{|\[|\||CSV|JSON|XML/.test(input),
    hasMultipleLanguages: /[^\x00-\x7F]/.test(input),
    questionCount: (input.match(/\?/g) || []).length,
    sentenceCount: (input.match(/[.!?]/g) || []).length,
  };
}

/**
 * DETECT TASK TYPE
 */
export function detectTaskType(input: string): 'generation' | 'classification' | 'validation' | 'compression' | 'reasoning' {
  const lower = input.toLowerCase();
  
  if (lower.includes('classify') || lower.includes('categorize')) {
    return 'classification';
  }
  
  if (lower.includes('validate') || lower.includes('check') || lower.includes('verify')) {
    return 'validation';
  }
  
  if (lower.includes('compress') || lower.includes('summarize') || lower.includes('shorten')) {
    return 'compression';
  }
  
  if (lower.includes('analyze') || lower.includes('explain') || lower.includes('reason')) {
    return 'reasoning';
  }
  
  return 'generation';
}
