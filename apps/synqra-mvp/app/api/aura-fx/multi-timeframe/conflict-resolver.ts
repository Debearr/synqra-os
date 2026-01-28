/**
 * Multi-Timeframe Conflict Resolution
 * STRICT: No averaging, no synthesis, no conflation
 * Line count: <50 lines (excluding comments/types)
 */

import type {
  MultiTimeframeInput,
  ConflictResolution,
  ConflictState,
  DirectionalBias,
} from "./types";

/**
 * Determines if two directional biases are opposite
 */
function areOpposite(d1: DirectionalBias, d2: DirectionalBias): boolean {
  return (
    (d1 === "BULLISH" && d2 === "BEARISH") ||
    (d1 === "BEARISH" && d2 === "BULLISH")
  );
}

/**
 * Determines conflict state based on direction and probability delta
 */
function determineConflictState(input: MultiTimeframeInput): ConflictState {
  const { h4, d1 } = input;

  // CONTRADICTORY: Opposite directional bias
  if (areOpposite(h4.direction, d1.direction)) {
    return "CONTRADICTORY";
  }

  // Direction matches - check probability delta
  const probabilityDelta = Math.abs(h4.probability - d1.probability);

  // ALIGNED: Same direction, probability delta ≤ 10%
  if (probabilityDelta <= 10) {
    return "ALIGNED";
  }

  // DIVERGENT: Same direction, probability delta > 10% and < 20%
  if (probabilityDelta > 10 && probabilityDelta < 20) {
    return "DIVERGENT";
  }

  // Edge case: delta ≥ 20% but same direction - treat as DIVERGENT
  return "DIVERGENT";
}

/**
 * Resolves multi-timeframe conflict with strict no-synthesis protocol
 */
export function resolveMultiTimeframeConflict(
  input: MultiTimeframeInput
): ConflictResolution {
  const state = determineConflictState(input);

  switch (state) {
    case "ALIGNED":
      return {
        state: "ALIGNED",
        action: "SHOW_PRIMARY",
        primary: input.h4,
        displayMessage: "Multi-timeframe consensus",
      };

    case "DIVERGENT":
      return {
        state: "DIVERGENT",
        action: "SHOW_BOTH",
        primary: input.h4,
        secondary: input.d1,
        displayMessage: "Timeframe-dependent scenarios",
      };

    case "CONTRADICTORY":
      return {
        state: "CONTRADICTORY",
        action: "SUPPRESS",
        displayMessage: "Conflicting timeframe bias — no assessment issued",
      };
  }
}
