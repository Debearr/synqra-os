/**
 * Multi-Timeframe Conflict Protocol Types
 * Strict state definitions with no synthesis allowed
 */

export type AllowedTimeframe = "H4" | "D1";

export type DirectionalBias = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface TimeframeAssessment {
  timeframe: AllowedTimeframe;
  direction: DirectionalBias;
  probability: number; // 0-100
}

export type ConflictState = "ALIGNED" | "DIVERGENT" | "CONTRADICTORY";

export interface ConflictResolution {
  state: ConflictState;
  action: "SHOW_PRIMARY" | "SHOW_BOTH" | "SUPPRESS";
  primary?: TimeframeAssessment;
  secondary?: TimeframeAssessment;
  displayMessage: string;
}

export interface MultiTimeframeInput {
  h4: TimeframeAssessment;
  d1: TimeframeAssessment;
}
