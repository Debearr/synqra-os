/**
 * Multi-Timeframe Conflict Resolution Tests
 * Validates all conflict states and ensures no synthesis
 */

import { resolveMultiTimeframeConflict } from "./conflict-resolver";
import { mapConflictToUIState, validateNoSynthesis } from "./ui-state-mapper";
import type { MultiTimeframeInput } from "./types";

// Test Case 1: ALIGNED - Same direction, probability delta ≤ 10%
export function testAlignedState() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "BULLISH", probability: 65 },
    d1: { timeframe: "D1", direction: "BULLISH", probability: 70 },
  };

  const resolution = resolveMultiTimeframeConflict(input);
  const uiState = mapConflictToUIState(resolution);

  console.assert(resolution.state === "ALIGNED", "State should be ALIGNED");
  console.assert(resolution.action === "SHOW_PRIMARY", "Action should be SHOW_PRIMARY");
  console.assert(
    resolution.displayMessage === "Multi-timeframe consensus",
    "Message should indicate consensus"
  );
  console.assert(uiState.shouldDisplay === true, "UI should display");
  console.assert(uiState.assessments.length === 1, "Should show only primary");
  console.assert(
    validateNoSynthesis(resolution, uiState),
    "No synthesis validation must pass"
  );

  return { passed: true, state: "ALIGNED" };
}

// Test Case 2: ALIGNED - Exact same probability
export function testAlignedExactMatch() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "BEARISH", probability: 75 },
    d1: { timeframe: "D1", direction: "BEARISH", probability: 75 },
  };

  const resolution = resolveMultiTimeframeConflict(input);
  const uiState = mapConflictToUIState(resolution);

  console.assert(resolution.state === "ALIGNED", "State should be ALIGNED");
  console.assert(uiState.assessments.length === 1, "Should show only primary");
  console.assert(
    validateNoSynthesis(resolution, uiState),
    "No synthesis validation must pass"
  );

  return { passed: true, state: "ALIGNED" };
}

// Test Case 3: DIVERGENT - Same direction, probability delta = 15%
export function testDivergentState() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "BULLISH", probability: 60 },
    d1: { timeframe: "D1", direction: "BULLISH", probability: 75 },
  };

  const resolution = resolveMultiTimeframeConflict(input);
  const uiState = mapConflictToUIState(resolution);

  console.assert(resolution.state === "DIVERGENT", "State should be DIVERGENT");
  console.assert(resolution.action === "SHOW_BOTH", "Action should be SHOW_BOTH");
  console.assert(
    resolution.displayMessage === "Timeframe-dependent scenarios",
    "Message should indicate divergence"
  );
  console.assert(uiState.shouldDisplay === true, "UI should display");
  console.assert(uiState.assessments.length === 2, "Should show both timeframes");
  console.assert(
    uiState.assessments[0].probability === 60,
    "H4 probability must be original"
  );
  console.assert(
    uiState.assessments[1].probability === 75,
    "D1 probability must be original"
  );
  console.assert(
    validateNoSynthesis(resolution, uiState),
    "No synthesis validation must pass"
  );

  return { passed: true, state: "DIVERGENT" };
}

// Test Case 4: DIVERGENT - Edge case at 11% delta
export function testDivergentEdgeCase() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "BEARISH", probability: 65 },
    d1: { timeframe: "D1", direction: "BEARISH", probability: 76 },
  };

  const resolution = resolveMultiTimeframeConflict(input);

  console.assert(resolution.state === "DIVERGENT", "State should be DIVERGENT at 11% delta");
  console.assert(resolution.action === "SHOW_BOTH", "Should show both timeframes");

  return { passed: true, state: "DIVERGENT" };
}

// Test Case 5: CONTRADICTORY - Opposite directions (BULLISH vs BEARISH)
export function testContradictoryState() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "BULLISH", probability: 70 },
    d1: { timeframe: "D1", direction: "BEARISH", probability: 65 },
  };

  const resolution = resolveMultiTimeframeConflict(input);
  const uiState = mapConflictToUIState(resolution);

  console.assert(resolution.state === "CONTRADICTORY", "State should be CONTRADICTORY");
  console.assert(resolution.action === "SUPPRESS", "Action should be SUPPRESS");
  console.assert(uiState.shouldDisplay === false, "UI should NOT display");
  console.assert(uiState.assessments.length === 0, "Should show no assessments");
  console.assert(
    validateNoSynthesis(resolution, uiState),
    "No synthesis validation must pass"
  );

  return { passed: true, state: "CONTRADICTORY" };
}

// Test Case 6: CONTRADICTORY - Opposite directions (BEARISH vs BULLISH)
export function testContradictoryReverse() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "BEARISH", probability: 80 },
    d1: { timeframe: "D1", direction: "BULLISH", probability: 85 },
  };

  const resolution = resolveMultiTimeframeConflict(input);
  const uiState = mapConflictToUIState(resolution);

  console.assert(resolution.state === "CONTRADICTORY", "State should be CONTRADICTORY");
  console.assert(uiState.shouldDisplay === false, "UI should NOT display");

  return { passed: true, state: "CONTRADICTORY" };
}

// Test Case 7: NEUTRAL handling
export function testNeutralBias() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "NEUTRAL", probability: 50 },
    d1: { timeframe: "D1", direction: "NEUTRAL", probability: 55 },
  };

  const resolution = resolveMultiTimeframeConflict(input);

  console.assert(resolution.state === "ALIGNED", "NEUTRAL + NEUTRAL should be ALIGNED");

  return { passed: true, state: "ALIGNED" };
}

// Test Case 8: Boundary test - exactly 10% delta
export function testBoundaryAligned() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "BULLISH", probability: 60 },
    d1: { timeframe: "D1", direction: "BULLISH", probability: 70 },
  };

  const resolution = resolveMultiTimeframeConflict(input);

  console.assert(
    resolution.state === "ALIGNED",
    "Exactly 10% delta should be ALIGNED"
  );

  return { passed: true, state: "ALIGNED" };
}

// Test Case 9: Synthesis prevention validation
export function testSynthesisPrevention() {
  const input: MultiTimeframeInput = {
    h4: { timeframe: "H4", direction: "BULLISH", probability: 60 },
    d1: { timeframe: "D1", direction: "BULLISH", probability: 80 },
  };

  const resolution = resolveMultiTimeframeConflict(input);
  const uiState = mapConflictToUIState(resolution);

  // Verify no averaging occurred
  const hasAveragedValue = uiState.assessments.some(
    (a) => a.probability === 70 // (60 + 80) / 2
  );

  console.assert(!hasAveragedValue, "Must not contain averaged probability");
  console.assert(
    validateNoSynthesis(resolution, uiState),
    "Synthesis validation must pass"
  );

  return { passed: true, state: "NO_SYNTHESIS" };
}

// Run all tests
export function runAllTests() {
  const tests = [
    testAlignedState,
    testAlignedExactMatch,
    testDivergentState,
    testDivergentEdgeCase,
    testContradictoryState,
    testContradictoryReverse,
    testNeutralBias,
    testBoundaryAligned,
    testSynthesisPrevention,
  ];

  const results = tests.map((test) => {
    try {
      return test();
    } catch (error) {
      return {
        passed: false,
        state: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}
