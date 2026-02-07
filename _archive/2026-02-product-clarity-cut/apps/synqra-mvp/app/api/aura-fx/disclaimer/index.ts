/**
 * Persistent Disclaimer System
 * Public API exports
 */

export { DisclaimerService, getTriggerMessage } from "./disclaimer-service";
export type {
  DisclaimerVersion,
  UserDisclaimerAcknowledgment,
  AcknowledgmentTrigger,
  DisclaimerCheckResult,
  AssessmentView,
  AssessmentType,
  DisclaimerState,
} from "./types";
