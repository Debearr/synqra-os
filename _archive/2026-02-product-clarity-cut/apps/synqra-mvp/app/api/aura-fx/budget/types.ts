/**
 * Budget Protection & Graduated Throttling Types
 * Deterministic state machine for API budget management
 */

/**
 * Budget throttling states based on usage percentage
 */
export type ThrottlingState =
  | "NORMAL"           // 0-69%: Normal operation
  | "ALERT"            // 70-79%: Admin alert only
  | "CACHE_EXTENDED"   // 80-89%: Extended cache TTL
  | "D1_DISABLED"      // 90-94%: Only H4 assessments
  | "STALE_ONLY"       // 95-99%: Show stale data only
  | "HARD_STOP";       // 100%+: Complete pause

/**
 * Timeframe availability based on throttling state
 */
export type TimeframeAvailability = {
  h4: boolean;
  d1: boolean;
};

/**
 * Cache TTL configuration (in seconds)
 */
export interface CacheTTLConfig {
  h4: number;
  d1: number;
}

/**
 * Budget usage snapshot
 */
export interface BudgetUsage {
  used: number;
  limit: number;
  percentage: number;
  period_start: string;
  period_end: string;
  last_updated: string;
}

/**
 * Throttling state with metadata
 */
export interface ThrottlingStateInfo {
  state: ThrottlingState;
  percentage: number;
  timeframeAvailability: TimeframeAvailability;
  cacheTTL: CacheTTLConfig;
  allowNewAssessments: boolean;
  showStaleData: boolean;
  userMessage: string;
  adminMessage: string;
  lastUpdated: string;
}

/**
 * Assessment request result
 */
export interface AssessmentRequestResult {
  allowed: boolean;
  reason: string;
  throttlingState: ThrottlingState;
  useCache: boolean;
  cacheTTL?: number;
  staleDataTimestamp?: string;
}

/**
 * Admin alert configuration
 */
export interface AdminAlert {
  id: string;
  threshold: number;
  state: ThrottlingState;
  message: string;
  severity: "info" | "warning" | "critical";
  triggered_at: string;
  acknowledged: boolean;
}

/**
 * Budget tracking record
 */
export interface BudgetTrackingRecord {
  id: string;
  timestamp: string;
  usage_percentage: number;
  throttling_state: ThrottlingState;
  requests_allowed: number;
  requests_throttled: number;
  cache_hits: number;
  cache_misses: number;
}

/**
 * Stale data metadata
 */
export interface StaleDataMetadata {
  lastUpdated: string;
  ageInHours: number;
  isStale: boolean;
  throttlingState: ThrottlingState;
}
