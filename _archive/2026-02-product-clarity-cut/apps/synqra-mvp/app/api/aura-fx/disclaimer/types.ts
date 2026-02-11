/**
 * Disclaimer Acknowledgment System Types
 */

export interface DisclaimerVersion {
  id: string;
  version: string;
  content: string;
  methodology_content: string;
  effective_date: string;
  is_active: boolean;
  created_at: string;
}

export interface UserDisclaimerAcknowledgment {
  id: string;
  user_id: string;
  disclaimer_version: string;
  acknowledged_at: string;
  acknowledgment_trigger: AcknowledgmentTrigger;
  created_at: string;
}

export type AcknowledgmentTrigger =
  | "initial"
  | "90_day_expiry"
  | "10_view_threshold"
  | "version_update";

export interface DisclaimerCheckResult {
  required: boolean;
  reason: string;
  last_acknowledgment: string | null;
  current_version: string;
}

export interface AssessmentView {
  id: string;
  user_id: string;
  assessment_type: AssessmentType;
  viewed_at: string;
  created_at: string;
}

export type AssessmentType =
  | "aurafx_signal"
  | "multi_timeframe"
  | "signals_hub"
  | "assessment_calibration";

export interface DisclaimerState {
  isVisible: boolean;
  isExpanded: boolean;
  requiresAcknowledgment: boolean;
  trigger: AcknowledgmentTrigger | null;
  version: string;
  content: string;
  methodologyContent: string;
}
