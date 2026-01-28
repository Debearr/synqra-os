/**
 * UI State Mapping for Multi-Timeframe Conflict States
 * Maps conflict resolution to display-ready UI states
 */

import type { ConflictResolution } from "./types";

export interface UIState {
  shouldDisplay: boolean;
  variant: "consensus" | "divergent" | "suppressed";
  title: string;
  subtitle: string;
  assessments: Array<{
    timeframe: string;
    direction: string;
    probability: number;
    label: string;
  }>;
  statusColor: "green" | "amber" | "red";
  disclaimer: string;
}

/**
 * Maps conflict resolution to UI state
 * Each state has explicit display rules with no synthesis
 */
export function mapConflictToUIState(resolution: ConflictResolution): UIState {
  switch (resolution.action) {
    case "SHOW_PRIMARY":
      // ALIGNED state: Show single timeframe with consensus message
      return {
        shouldDisplay: true,
        variant: "consensus",
        title: "Directional Assessment",
        subtitle: resolution.displayMessage,
        assessments: [
          {
            timeframe: resolution.primary!.timeframe,
            direction: resolution.primary!.direction,
            probability: resolution.primary!.probability,
            label: "Primary Timeframe",
          },
        ],
        statusColor: "green",
        disclaimer:
          "Multi-timeframe consensus detected. Historical probability analysis only — not financial advice or execution guidance.",
      };

    case "SHOW_BOTH":
      // DIVERGENT state: Show both timeframes with explicit divergence notice
      return {
        shouldDisplay: true,
        variant: "divergent",
        title: "Timeframe-Dependent Assessment",
        subtitle: resolution.displayMessage,
        assessments: [
          {
            timeframe: resolution.primary!.timeframe,
            direction: resolution.primary!.direction,
            probability: resolution.primary!.probability,
            label: "H4 Assessment",
          },
          {
            timeframe: resolution.secondary!.timeframe,
            direction: resolution.secondary!.direction,
            probability: resolution.secondary!.probability,
            label: "D1 Assessment",
          },
        ],
        statusColor: "amber",
        disclaimer:
          "Timeframes show divergent probabilities. No synthesis performed. Historical analysis only — not financial advice or execution guidance.",
      };

    case "SUPPRESS":
      // CONTRADICTORY state: Do not display assessment
      return {
        shouldDisplay: false,
        variant: "suppressed",
        title: "Assessment Suppressed",
        subtitle: resolution.displayMessage,
        assessments: [],
        statusColor: "red",
        disclaimer:
          "Contradictory timeframe bias detected. No assessment can be issued. This is not a directive to take any action.",
      };
  }
}

/**
 * Validation: Ensures no synthesis occurred
 * Returns true if the UI state is valid (no averaging, no conflation)
 */
export function validateNoSynthesis(
  resolution: ConflictResolution,
  uiState: UIState
): boolean {
  // Rule 1: CONTRADICTORY must never display
  if (resolution.state === "CONTRADICTORY" && uiState.shouldDisplay) {
    return false;
  }

  // Rule 2: Number of assessments must match action
  if (resolution.action === "SHOW_PRIMARY" && uiState.assessments.length !== 1) {
    return false;
  }

  if (resolution.action === "SHOW_BOTH" && uiState.assessments.length !== 2) {
    return false;
  }

  if (resolution.action === "SUPPRESS" && uiState.assessments.length !== 0) {
    return false;
  }

  // Rule 3: Probabilities must be original values (no averaging)
  if (resolution.primary) {
    const primaryInUI = uiState.assessments.find(
      (a) => a.timeframe === resolution.primary!.timeframe
    );
    if (primaryInUI && primaryInUI.probability !== resolution.primary.probability) {
      return false;
    }
  }

  if (resolution.secondary) {
    const secondaryInUI = uiState.assessments.find(
      (a) => a.timeframe === resolution.secondary!.timeframe
    );
    if (secondaryInUI && secondaryInUI.probability !== resolution.secondary.probability) {
      return false;
    }
  }

  return true;
}
