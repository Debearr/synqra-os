/**
 * Agent Decision Traceability System
 * Public API exports
 * 
 * CRITICAL: Logs are for human audit only
 * - No algorithmic feedback or self-optimization
 * - No user-facing exposure beyond minimal attribution
 */

// Service
export { TraceabilityService } from "./traceability-service";

// Assessment wrapper
export {
  AssessmentWithTraceability,
  generateAuraFxSignalWithTraceability,
  logAgentAction,
} from "./assessment-wrapper";

// Helper functions

// Types
export type {
  AgentIdentity,
  AgentRole,
  PromptSnapshot,
  ReasoningSnapshotRef,
  AgentTraceabilityRecord,
  ReasoningSnapshot,
  ReasoningStep,
  ContextSnapshot,
  AgentAttribution,
  AuditLogFilters,
  AuditLogQueryResult,
  PromptVersionRegistry,
  AgentVersionRegistry,
} from "./types";

export type {
  AssessmentContext,
  AgentExecutionMetadata,
  PromptMetadata,
} from "./assessment-wrapper";
