/**
 * ============================================================
 * VALIDATION PIPELINE - NØID LABS
 * ============================================================
 * Centralized validation for all AI outputs
 * 
 * Apple/Tesla principle: Validate once, trust everywhere
 * Every output passes through quality gates before reaching users
 */

import { z } from "zod";
import { BRAND_VOICE } from "../rprd/patterns";
import { ValidationError, type ContentType } from "../types";

// ============================================================
// VALIDATION RULES
// ============================================================

export interface ValidationRule {
  name: string;
  check: (content: string) => boolean;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
  metadata?: Record<string, any>;
}

// ============================================================
// CONTENT VALIDATORS
// ============================================================

const COMMON_RULES: ValidationRule[] = [
  {
    name: "min_length",
    check: (content) => content.trim().length >= 10,
    message: "Content too short (minimum 10 characters)",
    severity: "error",
  },
  {
    name: "max_length",
    check: (content) => content.trim().length <= 10000,
    message: "Content too long (maximum 10,000 characters)",
    severity: "error",
  },
  {
    name: "no_empty",
    check: (content) => content.trim().length > 0,
    message: "Content cannot be empty",
    severity: "error",
  },
  {
    name: "no_excessive_caps",
    check: (content) => {
      const allCapsWords = content.match(/\b[A-Z]{4,}\b/g) || [];
      return allCapsWords.length <= 2;
    },
    message: "Too many all-caps words (not premium)",
    severity: "warning",
  },
  {
    name: "no_excessive_exclamation",
    check: (content) => (content.match(/!/g) || []).length <= 2,
    message: "Too many exclamation marks (keep it subtle)",
    severity: "warning",
  },
  {
    name: "brand_voice_forbidden_words",
    check: (content) => {
      const lower = content.toLowerCase();
      return !BRAND_VOICE.forbidden.some((word) =>
        lower.includes(word.toLowerCase())
      );
    },
    message: "Contains forbidden marketing buzzwords",
    severity: "warning",
  },
];

const EMAIL_RULES: ValidationRule[] = [
  ...COMMON_RULES,
  {
    name: "email_min_length",
    check: (content) => content.trim().length >= 50,
    message: "Email too short (minimum 50 characters)",
    severity: "error",
  },
  {
    name: "email_has_greeting",
    check: (content) => /^(hi|hello|hey|dear|greetings)/i.test(content.trim()),
    message: "Email should start with a greeting",
    severity: "warning",
  },
];

const SOCIAL_RULES: ValidationRule[] = [
  ...COMMON_RULES,
  {
    name: "social_min_length",
    check: (content) => content.trim().length >= 20,
    message: "Social post too short (minimum 20 characters)",
    severity: "error",
  },
  {
    name: "social_max_hashtags",
    check: (content) => (content.match(/#\w+/g) || []).length <= 10,
    message: "Too many hashtags (maximum 10)",
    severity: "warning",
  },
];

const COPY_RULES: ValidationRule[] = [
  ...COMMON_RULES,
  {
    name: "copy_clear_value",
    check: (content) => content.length >= 30,
    message: "Copy should clearly communicate value",
    severity: "warning",
  },
];

const RULE_SETS: Record<ContentType, ValidationRule[]> = {
  email: EMAIL_RULES,
  social: SOCIAL_RULES,
  copy: COPY_RULES,
  script: COMMON_RULES,
  campaign: COMMON_RULES,
};

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate content against type-specific rules
 */
export function validateContent(
  content: string,
  type: ContentType
): ValidationResult {
  const rules = RULE_SETS[type] || COMMON_RULES;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of rules) {
    try {
      if (!rule.check(content)) {
        if (rule.severity === "error") {
          errors.push(rule.message);
        } else {
          warnings.push(rule.message);
        }
      }
    } catch (err) {
      console.warn(`Validation rule "${rule.name}" failed:`, err);
    }
  }

  // Calculate quality score (100 - (errors * 20) - (warnings * 5))
  const score = Math.max(0, 100 - errors.length * 20 - warnings.length * 5);

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    score,
    metadata: {
      rulesChecked: rules.length,
      contentLength: content.length,
    },
  };
}

/**
 * Validate with Zod schema
 */
export function validateWithSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Schema validation failed",
        { issues: error.issues }
      );
    }
    throw error;
  }
}

/**
 * Validate JSON structure
 */
export function validateJSON(content: string): any {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new ValidationError("Invalid JSON format");
  }
}

/**
 * Quick brand voice check (for real-time feedback)
 */
export function quickBrandCheck(content: string): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const lower = content.toLowerCase();

  // Check forbidden words
  for (const word of BRAND_VOICE.forbidden) {
    if (lower.includes(word.toLowerCase())) {
      issues.push(`Avoid "${word}"`);
    }
  }

  // Check excessive punctuation
  if ((content.match(/!/g) || []).length > 2) {
    issues.push("Too many exclamation marks");
  }

  // Check all caps
  if (content.match(/\b[A-Z]{4,}\b/g)?.length) {
    issues.push("Avoid all-caps words");
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

// ============================================================
// VALIDATION PIPELINE
// ============================================================

export interface ValidationPipelineConfig {
  contentType: ContentType;
  strictMode?: boolean; // If true, warnings become errors
  customRules?: ValidationRule[];
}

export class ValidationPipeline {
  private config: ValidationPipelineConfig;

  constructor(config: ValidationPipelineConfig) {
    this.config = config;
  }

  /**
   * Run full validation pipeline
   */
  validate(content: string): ValidationResult {
    // Step 1: Type-specific validation
    const result = validateContent(content, this.config.contentType);

    // Step 2: Apply custom rules if any
    if (this.config.customRules) {
      for (const rule of this.config.customRules) {
        try {
          if (!rule.check(content)) {
            if (rule.severity === "error") {
              result.errors.push(rule.message);
            } else {
              result.warnings.push(rule.message);
            }
          }
        } catch (err) {
          console.warn(`Custom rule "${rule.name}" failed:`, err);
        }
      }
    }

    // Step 3: Strict mode - convert warnings to errors
    if (this.config.strictMode && result.warnings.length > 0) {
      result.errors.push(...result.warnings);
      result.warnings = [];
      result.passed = false;
    }

    // Recalculate score
    result.score = Math.max(
      0,
      100 - result.errors.length * 20 - result.warnings.length * 5
    );

    return result;
  }

  /**
   * Validate and throw if failed
   */
  validateOrThrow(content: string): void {
    const result = this.validate(content);
    if (!result.passed) {
      throw new ValidationError(
        `Content validation failed: ${result.errors.join(", ")}`,
        { validationResult: result }
      );
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Create validation pipeline for content type
 */
export function createValidator(
  contentType: ContentType,
  config?: Partial<ValidationPipelineConfig>
): ValidationPipeline {
  return new ValidationPipeline({
    contentType,
    ...config,
  });
}

/**
 * Batch validate multiple pieces of content
 */
export async function validateBatch(
  items: Array<{ content: string; type: ContentType }>
): Promise<ValidationResult[]> {
  return items.map((item) => validateContent(item.content, item.type));
}
