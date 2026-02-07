/**
 * Throttling State Machine Tests
 * Ensures deterministic and testable behavior
 */

import {
  determineThrottlingState,
  getTimeframeAvailability,
  getCacheTTL,
  allowNewAssessments,
  shouldShowStaleData,
  evaluateAssessmentRequest,
  shouldTriggerAlert,
} from "./throttling-state-machine";
import type { ThrottlingState } from "./types";

// ============================================================================
// THRESHOLD TESTS
// ============================================================================

describe("determineThrottlingState", () => {
  test("0-69%: NORMAL", () => {
    expect(determineThrottlingState(0)).toBe("NORMAL");
    expect(determineThrottlingState(35)).toBe("NORMAL");
    expect(determineThrottlingState(69)).toBe("NORMAL");
    expect(determineThrottlingState(69.9)).toBe("NORMAL");
  });

  test("70-79%: ALERT", () => {
    expect(determineThrottlingState(70)).toBe("ALERT");
    expect(determineThrottlingState(75)).toBe("ALERT");
    expect(determineThrottlingState(79)).toBe("ALERT");
    expect(determineThrottlingState(79.9)).toBe("ALERT");
  });

  test("80-89%: CACHE_EXTENDED", () => {
    expect(determineThrottlingState(80)).toBe("CACHE_EXTENDED");
    expect(determineThrottlingState(85)).toBe("CACHE_EXTENDED");
    expect(determineThrottlingState(89)).toBe("CACHE_EXTENDED");
    expect(determineThrottlingState(89.9)).toBe("CACHE_EXTENDED");
  });

  test("90-94%: D1_DISABLED", () => {
    expect(determineThrottlingState(90)).toBe("D1_DISABLED");
    expect(determineThrottlingState(92)).toBe("D1_DISABLED");
    expect(determineThrottlingState(94)).toBe("D1_DISABLED");
    expect(determineThrottlingState(94.9)).toBe("D1_DISABLED");
  });

  test("95-99%: STALE_ONLY", () => {
    expect(determineThrottlingState(95)).toBe("STALE_ONLY");
    expect(determineThrottlingState(97)).toBe("STALE_ONLY");
    expect(determineThrottlingState(99)).toBe("STALE_ONLY");
    expect(determineThrottlingState(99.9)).toBe("STALE_ONLY");
  });

  test("100%+: HARD_STOP", () => {
    expect(determineThrottlingState(100)).toBe("HARD_STOP");
    expect(determineThrottlingState(105)).toBe("HARD_STOP");
    expect(determineThrottlingState(150)).toBe("HARD_STOP");
  });

  test("Boundary precision", () => {
    expect(determineThrottlingState(69.99999)).toBe("NORMAL");
    expect(determineThrottlingState(70.00001)).toBe("ALERT");
    expect(determineThrottlingState(79.99999)).toBe("ALERT");
    expect(determineThrottlingState(80.00001)).toBe("CACHE_EXTENDED");
  });
});

// ============================================================================
// TIMEFRAME AVAILABILITY TESTS
// ============================================================================

describe("getTimeframeAvailability", () => {
  test("NORMAL: Both H4 and D1 available", () => {
    const result = getTimeframeAvailability("NORMAL");
    expect(result.h4).toBe(true);
    expect(result.d1).toBe(true);
  });

  test("ALERT: Both H4 and D1 available", () => {
    const result = getTimeframeAvailability("ALERT");
    expect(result.h4).toBe(true);
    expect(result.d1).toBe(true);
  });

  test("CACHE_EXTENDED: Both H4 and D1 available", () => {
    const result = getTimeframeAvailability("CACHE_EXTENDED");
    expect(result.h4).toBe(true);
    expect(result.d1).toBe(true);
  });

  test("D1_DISABLED: Only H4 available", () => {
    const result = getTimeframeAvailability("D1_DISABLED");
    expect(result.h4).toBe(true);
    expect(result.d1).toBe(false);
  });

  test("STALE_ONLY: Neither available", () => {
    const result = getTimeframeAvailability("STALE_ONLY");
    expect(result.h4).toBe(false);
    expect(result.d1).toBe(false);
  });

  test("HARD_STOP: Neither available", () => {
    const result = getTimeframeAvailability("HARD_STOP");
    expect(result.h4).toBe(false);
    expect(result.d1).toBe(false);
  });
});

// ============================================================================
// CACHE TTL TESTS
// ============================================================================

describe("getCacheTTL", () => {
  const DEFAULT_H4 = 4 * 60 * 60; // 4 hours
  const DEFAULT_D1 = 24 * 60 * 60; // 24 hours
  const EXTENDED_H4 = 8 * 60 * 60; // 8 hours
  const EXTENDED_D1 = 48 * 60 * 60; // 48 hours

  test("NORMAL: Default TTL", () => {
    const result = getCacheTTL("NORMAL");
    expect(result.h4).toBe(DEFAULT_H4);
    expect(result.d1).toBe(DEFAULT_D1);
  });

  test("ALERT: Default TTL", () => {
    const result = getCacheTTL("ALERT");
    expect(result.h4).toBe(DEFAULT_H4);
    expect(result.d1).toBe(DEFAULT_D1);
  });

  test("CACHE_EXTENDED: Extended TTL (H4: 4h→8h, D1: 24h→48h)", () => {
    const result = getCacheTTL("CACHE_EXTENDED");
    expect(result.h4).toBe(EXTENDED_H4);
    expect(result.d1).toBe(EXTENDED_D1);
  });

  test("D1_DISABLED: Extended TTL", () => {
    const result = getCacheTTL("D1_DISABLED");
    expect(result.h4).toBe(EXTENDED_H4);
    expect(result.d1).toBe(EXTENDED_D1);
  });

  test("STALE_ONLY: Extended TTL", () => {
    const result = getCacheTTL("STALE_ONLY");
    expect(result.h4).toBe(EXTENDED_H4);
    expect(result.d1).toBe(EXTENDED_D1);
  });

  test("HARD_STOP: Extended TTL", () => {
    const result = getCacheTTL("HARD_STOP");
    expect(result.h4).toBe(EXTENDED_H4);
    expect(result.d1).toBe(EXTENDED_D1);
  });
});

// ============================================================================
// NEW ASSESSMENT ALLOWANCE TESTS
// ============================================================================

describe("allowNewAssessments", () => {
  test("NORMAL: Allow new assessments", () => {
    expect(allowNewAssessments("NORMAL")).toBe(true);
  });

  test("ALERT: Allow new assessments", () => {
    expect(allowNewAssessments("ALERT")).toBe(true);
  });

  test("CACHE_EXTENDED: Allow new assessments", () => {
    expect(allowNewAssessments("CACHE_EXTENDED")).toBe(true);
  });

  test("D1_DISABLED: Allow new assessments (H4 only)", () => {
    expect(allowNewAssessments("D1_DISABLED")).toBe(true);
  });

  test("STALE_ONLY: Deny new assessments", () => {
    expect(allowNewAssessments("STALE_ONLY")).toBe(false);
  });

  test("HARD_STOP: Deny new assessments", () => {
    expect(allowNewAssessments("HARD_STOP")).toBe(false);
  });
});

// ============================================================================
// STALE DATA TESTS
// ============================================================================

describe("shouldShowStaleData", () => {
  test("NORMAL: No stale data", () => {
    expect(shouldShowStaleData("NORMAL")).toBe(false);
  });

  test("ALERT: No stale data", () => {
    expect(shouldShowStaleData("ALERT")).toBe(false);
  });

  test("CACHE_EXTENDED: No stale data", () => {
    expect(shouldShowStaleData("CACHE_EXTENDED")).toBe(false);
  });

  test("D1_DISABLED: No stale data", () => {
    expect(shouldShowStaleData("D1_DISABLED")).toBe(false);
  });

  test("STALE_ONLY: Show stale data", () => {
    expect(shouldShowStaleData("STALE_ONLY")).toBe(true);
  });

  test("HARD_STOP: Show stale data", () => {
    expect(shouldShowStaleData("HARD_STOP")).toBe(true);
  });
});

// ============================================================================
// ASSESSMENT REQUEST EVALUATION TESTS
// ============================================================================

describe("evaluateAssessmentRequest", () => {
  test("NORMAL: H4 request allowed", () => {
    const result = evaluateAssessmentRequest("H4", "NORMAL", false);
    expect(result.allowed).toBe(true);
    expect(result.useCache).toBe(false);
    expect(result.throttlingState).toBe("NORMAL");
  });

  test("NORMAL: D1 request allowed", () => {
    const result = evaluateAssessmentRequest("D1", "NORMAL", false);
    expect(result.allowed).toBe(true);
    expect(result.useCache).toBe(false);
  });

  test("D1_DISABLED: H4 request allowed", () => {
    const result = evaluateAssessmentRequest("H4", "D1_DISABLED", false);
    expect(result.allowed).toBe(true);
    expect(result.useCache).toBe(false);
  });

  test("D1_DISABLED: D1 request denied without cache", () => {
    const result = evaluateAssessmentRequest("D1", "D1_DISABLED", false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("D1 assessments temporarily unavailable");
  });

  test("D1_DISABLED: D1 request served from cache", () => {
    const result = evaluateAssessmentRequest("D1", "D1_DISABLED", true);
    expect(result.allowed).toBe(true);
    expect(result.useCache).toBe(true);
    expect(result.reason).toContain("cached data");
  });

  test("STALE_ONLY: Request denied without cache", () => {
    const result = evaluateAssessmentRequest("H4", "STALE_ONLY", false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("no cached data");
  });

  test("STALE_ONLY: Request served from cache", () => {
    const result = evaluateAssessmentRequest("H4", "STALE_ONLY", true);
    expect(result.allowed).toBe(true);
    expect(result.useCache).toBe(true);
    expect(result.staleDataTimestamp).toBeDefined();
  });

  test("HARD_STOP: Request denied without cache", () => {
    const result = evaluateAssessmentRequest("H4", "HARD_STOP", false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Service temporarily limited");
  });

  test("HARD_STOP: Request served from cache", () => {
    const result = evaluateAssessmentRequest("H4", "HARD_STOP", true);
    expect(result.allowed).toBe(true);
    expect(result.useCache).toBe(true);
    expect(result.staleDataTimestamp).toBeDefined();
  });

  test("CACHE_EXTENDED: Fresh cache used", () => {
    const cacheAge = 2 * 60 * 60; // 2 hours
    const result = evaluateAssessmentRequest("H4", "CACHE_EXTENDED", true, cacheAge);
    expect(result.allowed).toBe(true);
    expect(result.useCache).toBe(true);
  });

  test("CACHE_EXTENDED: Stale cache bypassed", () => {
    const cacheAge = 10 * 60 * 60; // 10 hours (> 8h extended TTL)
    const result = evaluateAssessmentRequest("H4", "CACHE_EXTENDED", true, cacheAge);
    expect(result.allowed).toBe(true);
    expect(result.useCache).toBe(false); // Cache too old, make new request
  });
});

// ============================================================================
// ALERT TRIGGER TESTS
// ============================================================================

describe("shouldTriggerAlert", () => {
  test("No alert when state unchanged", () => {
    expect(shouldTriggerAlert("NORMAL", "NORMAL")).toBe(false);
    expect(shouldTriggerAlert("ALERT", "ALERT")).toBe(false);
  });

  test("Alert when moving to more restrictive state", () => {
    expect(shouldTriggerAlert("NORMAL", "ALERT")).toBe(true);
    expect(shouldTriggerAlert("ALERT", "CACHE_EXTENDED")).toBe(true);
    expect(shouldTriggerAlert("CACHE_EXTENDED", "D1_DISABLED")).toBe(true);
    expect(shouldTriggerAlert("D1_DISABLED", "STALE_ONLY")).toBe(true);
    expect(shouldTriggerAlert("STALE_ONLY", "HARD_STOP")).toBe(true);
  });

  test("No alert when moving to less restrictive state", () => {
    expect(shouldTriggerAlert("HARD_STOP", "STALE_ONLY")).toBe(false);
    expect(shouldTriggerAlert("STALE_ONLY", "D1_DISABLED")).toBe(false);
    expect(shouldTriggerAlert("D1_DISABLED", "CACHE_EXTENDED")).toBe(false);
    expect(shouldTriggerAlert("CACHE_EXTENDED", "ALERT")).toBe(false);
    expect(shouldTriggerAlert("ALERT", "NORMAL")).toBe(false);
  });

  test("Alert when jumping multiple states", () => {
    expect(shouldTriggerAlert("NORMAL", "D1_DISABLED")).toBe(true);
    expect(shouldTriggerAlert("ALERT", "HARD_STOP")).toBe(true);
  });
});

// ============================================================================
// DETERMINISM TESTS
// ============================================================================

describe("Deterministic behavior", () => {
  test("Same input always produces same output", () => {
    const testCases = [0, 50, 70, 80, 90, 95, 100];

    testCases.forEach((percentage) => {
      const result1 = determineThrottlingState(percentage);
      const result2 = determineThrottlingState(percentage);
      const result3 = determineThrottlingState(percentage);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  test("State machine is pure (no side effects)", () => {
    const initialState = determineThrottlingState(75);

    // Call multiple times
    determineThrottlingState(85);
    determineThrottlingState(95);

    // Original call should still return same result
    const finalState = determineThrottlingState(75);
    expect(finalState).toBe(initialState);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("End-to-end scenarios", () => {
  test("Scenario: Budget gradually increases", () => {
    const states: ThrottlingState[] = [];

    for (let i = 0; i <= 100; i += 10) {
      states.push(determineThrottlingState(i));
    }

    expect(states).toEqual([
      "NORMAL",      // 0%
      "NORMAL",      // 10%
      "NORMAL",      // 20%
      "NORMAL",      // 30%
      "NORMAL",      // 40%
      "NORMAL",      // 50%
      "NORMAL",      // 60%
      "ALERT",       // 70%
      "CACHE_EXTENDED", // 80%
      "D1_DISABLED", // 90%
      "HARD_STOP",   // 100%
    ]);
  });

  test("Scenario: Never publish mixed-freshness assessments", () => {
    // STALE_ONLY: Can only serve cached data
    const staleResult = evaluateAssessmentRequest("H4", "STALE_ONLY", true);
    expect(staleResult.useCache).toBe(true);
    expect(staleResult.staleDataTimestamp).toBeDefined();

    // HARD_STOP: Can only serve cached data
    const hardStopResult = evaluateAssessmentRequest("H4", "HARD_STOP", true);
    expect(hardStopResult.useCache).toBe(true);
    expect(hardStopResult.staleDataTimestamp).toBeDefined();

    // Both should have timestamps
    expect(staleResult.staleDataTimestamp).toBeTruthy();
    expect(hardStopResult.staleDataTimestamp).toBeTruthy();
  });
});

export { };
