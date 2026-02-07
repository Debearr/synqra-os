/**
 * Budget Protection & Graduated Throttling System
 * Public API exports
 */

// State machine (pure functions)
export {
  determineThrottlingState,
  getTimeframeAvailability,
  getCacheTTL,
  allowNewAssessments,
  shouldShowStaleData,
  getUserMessage,
  getAdminMessage,
  getThrottlingStateInfo,
  evaluateAssessmentRequest,
  shouldTriggerAlert,
} from "./throttling-state-machine";

// Service layer
export { BudgetService } from "./budget-service";

// Types
export type {
  ThrottlingState,
  TimeframeAvailability,
  CacheTTLConfig,
  BudgetUsage,
  ThrottlingStateInfo,
  AssessmentRequestResult,
  AdminAlert,
  BudgetTrackingRecord,
  StaleDataMetadata,
} from "./types";
