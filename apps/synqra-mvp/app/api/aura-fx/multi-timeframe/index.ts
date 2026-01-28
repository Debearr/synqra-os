/**
 * Multi-Timeframe Conflict Protocol
 * Public API exports
 */

export { resolveMultiTimeframeConflict } from "./conflict-resolver";
export { mapConflictToUIState, validateNoSynthesis } from "./ui-state-mapper";
export type {
  AllowedTimeframe,
  DirectionalBias,
  TimeframeAssessment,
  ConflictState,
  ConflictResolution,
  MultiTimeframeInput,
} from "./types";
export type { UIState } from "./ui-state-mapper";
