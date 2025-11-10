/**
 * Shared types for the Autonomous Sales Engine.
 */

export type LeadSource =
  | "web_form"
  | "telegram"
  | "n8n"
  | "manual"
  | "referral"
  | "unknown";

export type LeadStatus =
  | "new"
  | "qualified"
  | "nurturing"
  | "won"
  | "lost"
  | "inactive"
  | "upsell";

export type SalesEventType =
  | "lead_created"
  | "lead_scored"
  | "lead_nurtured"
  | "lead_closed"
  | "user_activated"
  | "retention_nudge_sent"
  | "support_touchpoint"
  | "system_notification";

export type LeadPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  source?: LeadSource;
  context?: string;
  telegramHandle?: string;
};

export type QualificationResult = {
  score: number;
  tier: "cold" | "warm" | "hot";
  rationale: string;
  recommendedNextStep: string;
  aiModel: string;
  aiSessionId?: string;
};

export type NurturePlan = {
  cadence: "immediate" | "daily" | "weekly";
  channels: Array<"telegram" | "email" | "n8n" | "system">;
  narrative: string;
  assets?: string[];
};

export type ClosePlan = {
  stripeCheckoutUrl?: string;
  telegramMessage?: string;
  followUpAt?: string;
  assignedRep?: string;
};

export type ActivationPlan = {
  welcomeFlowId?: string;
  telegramCtaButtons?: TelegramButton[];
  onboardingChecklist?: string[];
};

export type TelegramButton = {
  text: string;
  url?: string;
  callbackData?: string;
};

export type CacheEntry<T = unknown> = {
  key: string;
  value: T;
  scope?: "system" | "lead" | "user";
  expiresAt: string;
};

export type SalesEngineDiagnostic = {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  details?: Record<string, unknown>;
};

export type SelfHealingReport = {
  checkedAt: string;
  status: "ok" | "degraded" | "action_required";
  incidents: Array<{
    component: string;
    status: "ok" | "warning" | "critical";
    message: string;
    nextAction?: string;
  }>;
};
