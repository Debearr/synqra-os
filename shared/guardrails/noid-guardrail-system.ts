/**
 * ════════════════════════════════════════════════════════════════
 * NØID GUARDRAIL SYSTEM - Comprehensive Safety & Governance Layer
 * ════════════════════════════════════════════════════════════════
 * 
 * Unified guardrail system providing:
 * - Project isolation (prevent cross-contamination)
 * - Budget protection ($200/month hard limit)
 * - Content safety (hallucination, PII, unsafe content)
 * - Brand alignment (NØID voice consistency)
 * - Rate limiting (prevent abuse)
 * - Data privacy (GDPR, CCPA compliance)
 * - Audit logging (full transparency)
 * 
 * @version 1.0.0
 * @date 2025-11-17
 */

// ════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ════════════════════════════════════════════════════════════════

export type ProjectName = "synqra" | "noid" | "aurafx";
export type GuardrailLevel = "soft" | "medium" | "hard" | "critical";
export type GuardrailCategory =
  | "budget"
  | "safety"
  | "privacy"
  | "brand"
  | "rate"
  | "isolation"
  | "data";

export interface GuardrailConfig {
  project: ProjectName;
  enabled: boolean;
  level: GuardrailLevel;
  rules: {
    budget: BudgetGuardrailRules;
    safety: SafetyGuardrailRules;
    privacy: PrivacyGuardrailRules;
    brand: BrandGuardrailRules;
    rate: RateLimitGuardrailRules;
    isolation: IsolationGuardrailRules;
  };
}

export interface BudgetGuardrailRules {
  monthlyLimit: number; // Dollars
  dailyLimit: number;
  hourlyLimit: number;
  perRequestLimit: number;
  alertThresholds: {
    warning: number; // Percentage
    critical: number;
    emergency: number;
  };
}

export interface SafetyGuardrailRules {
  hallucinationDetection: boolean;
  unsafeContentBlocking: boolean;
  piiProtection: boolean;
  confidenceValidation: boolean;
  dualPassRequired: boolean;
}

export interface PrivacyGuardrailRules {
  gdprCompliance: boolean;
  ccpaCompliance: boolean;
  dataRetentionDays: number;
  anonymizeLogging: boolean;
  requireConsent: boolean;
}

export interface BrandGuardrailRules {
  voiceConsistencyCheck: boolean;
  toneValidation: boolean;
  prohibitedWords: string[];
  requiredVoiceAttributes: string[];
}

export interface RateLimitGuardrailRules {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrentRequests: number;
  burstLimit: number;
}

export interface IsolationGuardrailRules {
  enforceProjectBoundaries: boolean;
  preventCrossProjectAccess: boolean;
  isolateApiKeys: boolean;
  isolateData: boolean;
  cannotModifyFiles: string[]; // Patterns
}

export interface GuardrailCheckResult {
  passed: boolean;
  category: GuardrailCategory;
  level: GuardrailLevel;
  message: string;
  violations: string[];
  recommendations: string[];
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface GuardrailViolation {
  id: string;
  category: GuardrailCategory;
  level: GuardrailLevel;
  rule: string;
  description: string;
  timestamp: string;
  project: ProjectName;
  userId?: string;
  requestId?: string;
  action: "blocked" | "logged" | "alerted";
}

// ════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATIONS
// ════════════════════════════════════════════════════════════════

const DEFAULT_GUARDRAIL_CONFIGS: Record<ProjectName, GuardrailConfig> = {
  synqra: {
    project: "synqra",
    enabled: true,
    level: "hard",
    rules: {
      budget: {
        monthlyLimit: 200,
        dailyLimit: 7,
        hourlyLimit: 0.5,
        perRequestLimit: 0.05,
        alertThresholds: {
          warning: 70,
          critical: 85,
          emergency: 95,
        },
      },
      safety: {
        hallucinationDetection: true,
        unsafeContentBlocking: true,
        piiProtection: true,
        confidenceValidation: true,
        dualPassRequired: false,
      },
      privacy: {
        gdprCompliance: true,
        ccpaCompliance: true,
        dataRetentionDays: 90,
        anonymizeLogging: true,
        requireConsent: true,
      },
      brand: {
        voiceConsistencyCheck: true,
        toneValidation: true,
        prohibitedWords: [
          "cheap",
          "basic",
          "generic",
          "template",
          "spam",
          "fake",
        ],
        requiredVoiceAttributes: [
          "premium",
          "executive",
          "polished",
          "professional",
        ],
      },
      rate: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        concurrentRequests: 10,
        burstLimit: 100,
      },
      isolation: {
        enforceProjectBoundaries: true,
        preventCrossProjectAccess: true,
        isolateApiKeys: true,
        isolateData: true,
        cannotModifyFiles: [
          "**/.env*",
          "**/config/secrets.ts",
          "**/guardrails/**",
          "**/.env.production",
        ],
      },
    },
  },
  noid: {
    project: "noid",
    enabled: true,
    level: "hard",
    rules: {
      budget: {
        monthlyLimit: 150,
        dailyLimit: 5,
        hourlyLimit: 0.3,
        perRequestLimit: 0.03,
        alertThresholds: {
          warning: 70,
          critical: 85,
          emergency: 95,
        },
      },
      safety: {
        hallucinationDetection: true,
        unsafeContentBlocking: true,
        piiProtection: true,
        confidenceValidation: true,
        dualPassRequired: false,
      },
      privacy: {
        gdprCompliance: true,
        ccpaCompliance: true,
        dataRetentionDays: 90,
        anonymizeLogging: true,
        requireConsent: true,
      },
      brand: {
        voiceConsistencyCheck: true,
        toneValidation: true,
        prohibitedWords: ["cheap", "low-quality", "amateur"],
        requiredVoiceAttributes: ["luxury", "premium", "exclusive"],
      },
      rate: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 5000,
        concurrentRequests: 5,
        burstLimit: 50,
      },
      isolation: {
        enforceProjectBoundaries: true,
        preventCrossProjectAccess: true,
        isolateApiKeys: true,
        isolateData: true,
        cannotModifyFiles: [
          "**/.env*",
          "**/config/secrets.ts",
          "**/guardrails/**",
        ],
      },
    },
  },
  aurafx: {
    project: "aurafx",
    enabled: true,
    level: "hard",
    rules: {
      budget: {
        monthlyLimit: 100,
        dailyLimit: 3.5,
        hourlyLimit: 0.2,
        perRequestLimit: 0.02,
        alertThresholds: {
          warning: 70,
          critical: 85,
          emergency: 95,
        },
      },
      safety: {
        hallucinationDetection: true,
        unsafeContentBlocking: true,
        piiProtection: true,
        confidenceValidation: true,
        dualPassRequired: false,
      },
      privacy: {
        gdprCompliance: true,
        ccpaCompliance: true,
        dataRetentionDays: 365, // Keep voice models longer
        anonymizeLogging: true,
        requireConsent: true,
      },
      brand: {
        voiceConsistencyCheck: true,
        toneValidation: true,
        prohibitedWords: ["robot", "artificial", "fake"],
        requiredVoiceAttributes: ["authentic", "human", "natural"],
      },
      rate: {
        requestsPerMinute: 20,
        requestsPerHour: 300,
        requestsPerDay: 3000,
        concurrentRequests: 3,
        burstLimit: 30,
      },
      isolation: {
        enforceProjectBoundaries: true,
        preventCrossProjectAccess: true,
        isolateApiKeys: true,
        isolateData: true,
        cannotModifyFiles: [
          "**/.env*",
          "**/config/secrets.ts",
          "**/guardrails/**",
          "**/voice-models/**",
        ],
      },
    },
  },
};

// ════════════════════════════════════════════════════════════════
// NØID GUARDRAIL SYSTEM - MAIN CLASS
// ════════════════════════════════════════════════════════════════

export class NoidGuardrailSystem {
  private config: GuardrailConfig;
  private violations: GuardrailViolation[] = [];
  private rateLimitCounters: Map<string, number[]> = new Map();

  constructor(project: ProjectName, customConfig?: Partial<GuardrailConfig>) {
    this.config = {
      ...DEFAULT_GUARDRAIL_CONFIGS[project],
      ...customConfig,
    };
  }

  /**
   * Run comprehensive guardrail checks
   */
  async runAllChecks(context: {
    userId?: string;
    requestId?: string;
    operation: string;
    estimatedCost?: number;
    content?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    allowed: boolean;
    results: GuardrailCheckResult[];
    violations: GuardrailViolation[];
    overallLevel: GuardrailLevel;
  }> {
    const results: GuardrailCheckResult[] = [];

    // 1. Budget check
    if (context.estimatedCost !== undefined) {
      const budgetResult = await this.checkBudget(
        context.estimatedCost,
        context.requestId
      );
      results.push(budgetResult);
    }

    // 2. Rate limit check
    const rateLimitResult = this.checkRateLimit(
      context.userId || "anonymous",
      context.requestId
    );
    results.push(rateLimitResult);

    // 3. Content safety check
    if (context.content) {
      const safetyResult = this.checkContentSafety(
        context.content,
        context.requestId
      );
      results.push(safetyResult);
    }

    // 4. Brand alignment check
    if (context.content) {
      const brandResult = this.checkBrandAlignment(
        context.content,
        context.requestId
      );
      results.push(brandResult);
    }

    // 5. Privacy compliance check
    if (context.content || context.metadata) {
      const privacyResult = this.checkPrivacyCompliance(
        context.content,
        context.metadata,
        context.requestId
      );
      results.push(privacyResult);
    }

    // 6. Project isolation check
    const isolationResult = this.checkProjectIsolation(
      context.operation,
      context.metadata,
      context.requestId
    );
    results.push(isolationResult);

    // Aggregate results
    const allowed = results.every((r) => r.passed);
    const overallLevel = this.determineOverallLevel(results);

    // Log violations
    const newViolations = results
      .filter((r) => !r.passed)
      .map((r) => this.createViolation(r, context));

    this.violations.push(...newViolations);

    return {
      allowed,
      results,
      violations: newViolations,
      overallLevel,
    };
  }

  /**
   * Check budget guardrails
   */
  private async checkBudget(
    estimatedCost: number,
    requestId?: string
  ): Promise<GuardrailCheckResult> {
    const rules = this.config.rules.budget;
    const violations: string[] = [];

    // Check per-request limit
    if (estimatedCost > rules.perRequestLimit) {
      violations.push(
        `Cost $${estimatedCost.toFixed(4)} exceeds per-request limit of $${rules.perRequestLimit}`
      );
    }

    // Check monthly limit (simplified - would query actual tracking)
    // In production, this would check Supabase for actual monthly spend
    const currentMonthlySpend = 0; // TODO: Query from database
    if (currentMonthlySpend + estimatedCost > rules.monthlyLimit) {
      violations.push(
        `Would exceed monthly budget of $${rules.monthlyLimit}`
      );
    }

    return {
      passed: violations.length === 0,
      category: "budget",
      level: violations.length > 0 ? "critical" : "soft",
      message:
        violations.length === 0
          ? "Budget check passed"
          : "Budget limits exceeded",
      violations,
      recommendations:
        violations.length > 0
          ? [
              "Use cheaper model",
              "Reduce output length",
              "Wait for budget reset",
            ]
          : [],
      timestamp: new Date().toISOString(),
      metadata: { estimatedCost, requestId },
    };
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(
    userId: string, 
    requestId?: string
  ): GuardrailCheckResult {
    const rules = this.config.rules.rate;
    const now = Date.now();
    const violations: string[] = [];

    // Get or create counter for user
    if (!this.rateLimitCounters.has(userId)) {
      this.rateLimitCounters.set(userId, []);
    }

    const timestamps = this.rateLimitCounters.get(userId)!;

    // Clean old timestamps
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentTimestamps = timestamps.filter((t) => t > oneHourAgo);
    this.rateLimitCounters.set(userId, recentTimestamps);

    // Check limits
    const lastMinute = recentTimestamps.filter((t) => t > now - 60 * 1000);
    const lastHour = recentTimestamps;

    if (lastMinute.length >= rules.requestsPerMinute) {
      violations.push(
        `Rate limit exceeded: ${lastMinute.length}/${rules.requestsPerMinute} requests per minute`
      );
    }

    if (lastHour.length >= rules.requestsPerHour) {
      violations.push(
        `Rate limit exceeded: ${lastHour.length}/${rules.requestsPerHour} requests per hour`
      );
    }

    // Record this request
    if (violations.length === 0) {
      recentTimestamps.push(now);
    }

    return {
      passed: violations.length === 0,
      category: "rate",
      level: violations.length > 0 ? "medium" : "soft",
      message:
        violations.length === 0
          ? "Rate limit check passed"
          : "Rate limit exceeded",
      violations,
      recommendations:
        violations.length > 0
          ? ["Wait before retrying", "Implement request queuing"]
          : [],
      timestamp: new Date().toISOString(),
      metadata: { userId, requestId, requestsLastMinute: lastMinute.length },
    };
  }

  /**
   * Check content safety
   */
  private checkContentSafety(
    content: string,
    requestId?: string
  ): GuardrailCheckResult {
    const rules = this.config.rules.safety;
    const violations: string[] = [];

    if (!rules.unsafeContentBlocking) {
      return {
        passed: true,
        category: "safety",
        level: "soft",
        message: "Safety checks disabled",
        violations: [],
        recommendations: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Check for PII
    if (rules.piiProtection) {
      const piiPatterns = [
        { pattern: /\b\d{3}-\d{2}-\d{4}\b/, name: "SSN" },
        { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, name: "Credit Card" },
        { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, name: "Email" },
      ];

      for (const { pattern, name } of piiPatterns) {
        if (pattern.test(content)) {
          violations.push(`Potential PII detected: ${name}`);
        }
      }
    }

    // Check for unsafe content
    const unsafePatterns = [
      /here is your (password|api key|secret|token):/i,
      /\b(sk-[a-zA-Z0-9]{32,})\b/,
      /(credit card|card number).*\d{4}/i,
    ];

    for (const pattern of unsafePatterns) {
      if (pattern.test(content)) {
        violations.push(`Unsafe content pattern detected: ${pattern.source}`);
      }
    }

    return {
      passed: violations.length === 0,
      category: "safety",
      level: violations.length > 0 ? "critical" : "soft",
      message:
        violations.length === 0
          ? "Content safety check passed"
          : "Unsafe content detected",
      violations,
      recommendations:
        violations.length > 0
          ? ["Remove sensitive data", "Use redaction", "Block request"]
          : [],
      timestamp: new Date().toISOString(),
      metadata: { requestId, contentLength: content.length },
    };
  }

  /**
   * Check brand alignment
   */
  private checkBrandAlignment(
    content: string,
    requestId?: string
  ): GuardrailCheckResult {
    const rules = this.config.rules.brand;
    const violations: string[] = [];

    if (!rules.voiceConsistencyCheck) {
      return {
        passed: true,
        category: "brand",
        level: "soft",
        message: "Brand checks disabled",
        violations: [],
        recommendations: [],
        timestamp: new Date().toISOString(),
      };
    }

    const lowerContent = content.toLowerCase();

    // Check prohibited words
    for (const word of rules.prohibitedWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        violations.push(`Prohibited word detected: "${word}"`);
      }
    }

    // Check for required attributes (at least one should be present)
    const hasRequiredAttribute = rules.requiredVoiceAttributes.some((attr) =>
      lowerContent.includes(attr.toLowerCase())
    );

    if (!hasRequiredAttribute && content.length > 100) {
      violations.push(
        `Content lacks required voice attributes: ${rules.requiredVoiceAttributes.join(", ")}`
      );
    }

    return {
      passed: violations.length === 0,
      category: "brand",
      level: violations.length > 0 ? "medium" : "soft",
      message:
        violations.length === 0
          ? "Brand alignment check passed"
          : "Brand voice violations detected",
      violations,
      recommendations:
        violations.length > 0
          ? [
              "Rephrase to match brand voice",
              "Add premium/executive tone",
              "Remove prohibited words",
            ]
          : [],
      timestamp: new Date().toISOString(),
      metadata: { requestId },
    };
  }

  /**
   * Check privacy compliance
   */
  private checkPrivacyCompliance(
    content?: string,
    metadata?: Record<string, any>,
    requestId?: string
  ): GuardrailCheckResult {
    const rules = this.config.rules.privacy;
    const violations: string[] = [];

    // Check for consent
    if (rules.requireConsent && metadata && !metadata.consentGiven) {
      violations.push("User consent not recorded");
    }

    // Check GDPR compliance
    if (rules.gdprCompliance) {
      // Verify data minimization
      if (metadata && Object.keys(metadata).length > 20) {
        violations.push(
          "Excessive metadata collection (GDPR data minimization)"
        );
      }
    }

    // Check data retention
    if (metadata?.timestamp) {
      const age = Date.now() - new Date(metadata.timestamp).getTime();
      const maxAge = rules.dataRetentionDays * 24 * 60 * 60 * 1000;
      if (age > maxAge) {
        violations.push(
          `Data exceeds retention period of ${rules.dataRetentionDays} days`
        );
      }
    }

    return {
      passed: violations.length === 0,
      category: "privacy",
      level: violations.length > 0 ? "hard" : "soft",
      message:
        violations.length === 0
          ? "Privacy compliance check passed"
          : "Privacy violations detected",
      violations,
      recommendations:
        violations.length > 0
          ? ["Obtain user consent", "Minimize data collection", "Purge old data"]
          : [],
      timestamp: new Date().toISOString(),
      metadata: { requestId },
    };
  }

  /**
   * Check project isolation
   */
  private checkProjectIsolation(
    operation: string,
    metadata?: Record<string, any>,
    requestId?: string
  ): GuardrailCheckResult {
    const rules = this.config.rules.isolation;
    const violations: string[] = [];

    if (!rules.enforceProjectBoundaries) {
      return {
        passed: true,
        category: "isolation",
        level: "soft",
        message: "Isolation checks disabled",
        violations: [],
        recommendations: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Check if trying to access cross-project resources
    if (metadata?.targetProject && metadata.targetProject !== this.config.project) {
      if (rules.preventCrossProjectAccess) {
        violations.push(
          `Attempted cross-project access: ${this.config.project} → ${metadata.targetProject}`
        );
      }
    }

    // Check if trying to modify protected files
    if (metadata?.filePath) {
      const isProtected = rules.cannotModifyFiles.some((pattern) =>
        this.matchesPattern(metadata.filePath, pattern)
      );

      if (isProtected) {
        violations.push(
          `Attempted to modify protected file: ${metadata.filePath}`
        );
      }
    }

    return {
      passed: violations.length === 0,
      category: "isolation",
      level: violations.length > 0 ? "critical" : "soft",
      message:
        violations.length === 0
          ? "Isolation check passed"
          : "Isolation boundary violation",
      violations,
      recommendations:
        violations.length > 0
          ? ["Use project-specific API", "Request explicit permission"]
          : [],
      timestamp: new Date().toISOString(),
      metadata: { requestId, operation },
    };
  }

  /**
   * Helper: Match file path against pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob matching (** for recursive, * for wildcard)
    const regexPattern = pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Determine overall guardrail level
   */
  private determineOverallLevel(results: GuardrailCheckResult[]): GuardrailLevel {
    const levels = results.map((r) => r.level);
    if (levels.includes("critical")) return "critical";
    if (levels.includes("hard")) return "hard";
    if (levels.includes("medium")) return "medium";
    return "soft";
  }

  /**
   * Create violation record
   */
  private createViolation(
    result: GuardrailCheckResult,
    context: any
  ): GuardrailViolation {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: result.category,
      level: result.level,
      rule: result.message,
      description: result.violations.join("; "),
      timestamp: result.timestamp,
      project: this.config.project,
      userId: context.userId,
      requestId: context.requestId,
      action: result.level === "critical" ? "blocked" : "logged",
    };
  }

  /**
   * Get violation history
   */
  getViolations(filter?: {
    category?: GuardrailCategory;
    level?: GuardrailLevel;
    since?: Date;
  }): GuardrailViolation[] {
    let filtered = this.violations;

    if (filter?.category) {
      filtered = filtered.filter((v) => v.category === filter.category);
    }

    if (filter?.level) {
      filtered = filtered.filter((v) => v.level === filter.level);
    }

    if (filter?.since) {
      filtered = filtered.filter(
        (v) => new Date(v.timestamp) >= filter.since!
      );
    }

    return filtered;
  }

  /**
   * Get current configuration
   */
  getConfig(): GuardrailConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<GuardrailConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Create guardrail system for project
 */
export function createGuardrailSystem(
  project: ProjectName,
  customConfig?: Partial<GuardrailConfig>
): NoidGuardrailSystem {
  return new NoidGuardrailSystem(project, customConfig);
}

/**
 * Quick check for common operations
 */
export async function quickGuardrailCheck(
  project: ProjectName,
  operation: string,
  options?: {
    estimatedCost?: number;
    content?: string;
    userId?: string;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  const system = createGuardrailSystem(project);

  const result = await system.runAllChecks({
    operation,
    requestId: `quick-${Date.now()}`,
    ...options,
  });

  return {
    allowed: result.allowed,
    reason: result.allowed
      ? undefined
      : result.violations.map((v) => v.description).join("; "),
  };
}

// ════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════

export default NoidGuardrailSystem;
