/**
 * Budget Throttling State Machine
 * Deterministic graduated throttling based on budget usage
 * 
 * THRESHOLDS:
 * - 0-69%:   NORMAL - Full operation
 * - 70-79%:  ALERT - Admin alert only
 * - 80-89%:  CACHE_EXTENDED - Extend cache TTL
 * - 90-94%:  D1_DISABLED - H4 only
 * - 95-99%:  STALE_ONLY - Show stale data with timestamp
 * - 100%+:   HARD_STOP - Complete pause
 */

import type {
  ThrottlingState,
  ThrottlingStateInfo,
  TimeframeAvailability,
  CacheTTLConfig,
  AssessmentRequestResult,
} from "./types";

/**
 * Default cache TTL values (in seconds)
 */
const DEFAULT_CACHE_TTL: CacheTTLConfig = {
  h4: 4 * 60 * 60,   // 4 hours
  d1: 24 * 60 * 60,  // 24 hours
};

/**
 * Extended cache TTL values (in seconds)
 */
const EXTENDED_CACHE_TTL: CacheTTLConfig = {
  h4: 8 * 60 * 60,   // 8 hours
  d1: 48 * 60 * 60,  // 48 hours
};

/**
 * Determine throttling state from budget usage percentage
 * Pure function - deterministic and testable
 */
export function determineThrottlingState(percentage: number): ThrottlingState {
  if (percentage >= 100) return "HARD_STOP";
  if (percentage >= 95) return "STALE_ONLY";
  if (percentage >= 90) return "D1_DISABLED";
  if (percentage >= 80) return "CACHE_EXTENDED";
  if (percentage >= 70) return "ALERT";
  return "NORMAL";
}

/**
 * Get timeframe availability for a given throttling state
 */
export function getTimeframeAvailability(
  state: ThrottlingState
): TimeframeAvailability {
  switch (state) {
    case "NORMAL":
    case "ALERT":
    case "CACHE_EXTENDED":
      return { h4: true, d1: true };

    case "D1_DISABLED":
      return { h4: true, d1: false };

    case "STALE_ONLY":
    case "HARD_STOP":
      return { h4: false, d1: false };
  }
}

/**
 * Get cache TTL configuration for a given throttling state
 */
export function getCacheTTL(state: ThrottlingState): CacheTTLConfig {
  switch (state) {
    case "NORMAL":
    case "ALERT":
      return DEFAULT_CACHE_TTL;

    case "CACHE_EXTENDED":
    case "D1_DISABLED":
    case "STALE_ONLY":
    case "HARD_STOP":
      return EXTENDED_CACHE_TTL;
  }
}

/**
 * Check if new assessments are allowed
 */
export function allowNewAssessments(state: ThrottlingState): boolean {
  switch (state) {
    case "NORMAL":
    case "ALERT":
    case "CACHE_EXTENDED":
    case "D1_DISABLED":
      return true;

    case "STALE_ONLY":
    case "HARD_STOP":
      return false;
  }
}

/**
 * Check if stale data should be shown
 */
export function shouldShowStaleData(state: ThrottlingState): boolean {
  return state === "STALE_ONLY" || state === "HARD_STOP";
}

/**
 * Get user-facing message for throttling state
 */
export function getUserMessage(state: ThrottlingState): string {
  switch (state) {
    case "NORMAL":
      return "Service operating normally";

    case "ALERT":
      return "Service operating normally";

    case "CACHE_EXTENDED":
      return "Assessments may use cached data for optimal performance";

    case "D1_DISABLED":
      return "Daily (D1) assessments temporarily unavailable. H4 assessments available.";

    case "STALE_ONLY":
      return "Showing most recent cached assessment. Live updates temporarily paused.";

    case "HARD_STOP":
      return "Service temporarily limited. Showing last available data.";
  }
}

/**
 * Get admin-facing message for throttling state
 */
export function getAdminMessage(state: ThrottlingState, percentage: number): string {
  switch (state) {
    case "NORMAL":
      return `Budget usage: ${percentage.toFixed(1)}% - Normal operation`;

    case "ALERT":
      return `⚠️ Budget usage: ${percentage.toFixed(1)}% - Alert threshold reached`;

    case "CACHE_EXTENDED":
      return `⚠️ Budget usage: ${percentage.toFixed(1)}% - Cache TTL extended`;

    case "D1_DISABLED":
      return `🚨 Budget usage: ${percentage.toFixed(1)}% - D1 assessments disabled`;

    case "STALE_ONLY":
      return `🚨 Budget usage: ${percentage.toFixed(1)}% - Stale data only`;

    case "HARD_STOP":
      return `🛑 Budget usage: ${percentage.toFixed(1)}% - Hard stop activated`;
  }
}

/**
 * Get complete throttling state information
 * Main entry point for state machine
 */
export function getThrottlingStateInfo(
  percentage: number,
  lastUpdated: string = new Date().toISOString()
): ThrottlingStateInfo {
  const state = determineThrottlingState(percentage);

  return {
    state,
    percentage,
    timeframeAvailability: getTimeframeAvailability(state),
    cacheTTL: getCacheTTL(state),
    allowNewAssessments: allowNewAssessments(state),
    showStaleData: shouldShowStaleData(state),
    userMessage: getUserMessage(state),
    adminMessage: getAdminMessage(state, percentage),
    lastUpdated,
  };
}

/**
 * Evaluate assessment request based on throttling state
 * Returns whether request is allowed and how to handle it
 */
export function evaluateAssessmentRequest(
  timeframe: "H4" | "D1",
  throttlingState: ThrottlingState,
  hasCachedData: boolean,
  cacheAge?: number
): AssessmentRequestResult {
  const availability = getTimeframeAvailability(throttlingState);
  const cacheTTL = getCacheTTL(throttlingState);
  const allowNew = allowNewAssessments(throttlingState);

  // HARD_STOP: Only show stale data if available
  if (throttlingState === "HARD_STOP") {
    if (hasCachedData) {
      return {
        allowed: true,
        reason: "Serving stale cached data - service temporarily limited",
        throttlingState,
        useCache: true,
        staleDataTimestamp: new Date().toISOString(),
      };
    }
    return {
      allowed: false,
      reason: "Service temporarily limited - no cached data available",
      throttlingState,
      useCache: false,
    };
  }

  // STALE_ONLY: Only show stale data, no new assessments
  if (throttlingState === "STALE_ONLY") {
    if (hasCachedData) {
      return {
        allowed: true,
        reason: "Serving cached data - live updates paused",
        throttlingState,
        useCache: true,
        staleDataTimestamp: new Date().toISOString(),
      };
    }
    return {
      allowed: false,
      reason: "Live updates paused - no cached data available",
      throttlingState,
      useCache: false,
    };
  }

  // D1_DISABLED: Block D1 requests
  if (throttlingState === "D1_DISABLED" && timeframe === "D1") {
    if (hasCachedData) {
      return {
        allowed: true,
        reason: "D1 temporarily unavailable - serving cached data",
        throttlingState,
        useCache: true,
        cacheTTL: cacheTTL.d1,
      };
    }
    return {
      allowed: false,
      reason: "D1 assessments temporarily unavailable",
      throttlingState,
      useCache: false,
    };
  }

  // CACHE_EXTENDED or ALERT: Use cache if available and fresh enough
  if (
    (throttlingState === "CACHE_EXTENDED" || throttlingState === "ALERT") &&
    hasCachedData &&
    cacheAge !== undefined
  ) {
    const ttl = timeframe === "H4" ? cacheTTL.h4 : cacheTTL.d1;
    if (cacheAge < ttl) {
      return {
        allowed: true,
        reason: "Serving cached data within TTL",
        throttlingState,
        useCache: true,
        cacheTTL: ttl,
      };
    }
  }

  // NORMAL or cache miss: Allow new assessment
  if (allowNew) {
    const timeframeAllowed =
      timeframe === "H4" ? availability.h4 : availability.d1;

    if (timeframeAllowed) {
      return {
        allowed: true,
        reason: "New assessment allowed",
        throttlingState,
        useCache: false,
        cacheTTL: timeframe === "H4" ? cacheTTL.h4 : cacheTTL.d1,
      };
    }
  }

  // Fallback: Deny request
  return {
    allowed: false,
    reason: "Request denied by throttling policy",
    throttlingState,
    useCache: false,
  };
}

/**
 * Check if state transition should trigger admin alert
 */
export function shouldTriggerAlert(
  previousState: ThrottlingState,
  newState: ThrottlingState
): boolean {
  const stateOrder: ThrottlingState[] = [
    "NORMAL",
    "ALERT",
    "CACHE_EXTENDED",
    "D1_DISABLED",
    "STALE_ONLY",
    "HARD_STOP",
  ];

  const prevIndex = stateOrder.indexOf(previousState);
  const newIndex = stateOrder.indexOf(newState);

  // Trigger alert when moving to a more restrictive state
  return newIndex > prevIndex;
}
