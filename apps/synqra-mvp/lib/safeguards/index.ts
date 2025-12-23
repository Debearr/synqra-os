export { AppError, normalizeError } from "./errors";
export {
  logSafeguard,
  ensureCorrelationId,
  type SafeguardLog,
} from "./logging";
export {
  evaluateBudget,
  enforceBudget,
  type BudgetDecision,
} from "./budget";
export {
  evaluateKillSwitch,
  enforceKillSwitch,
  type KillSwitchDecision,
} from "./killSwitch";
export {
  requireConfirmation,
  type ConfirmationResult,
} from "./confirm";
export { buildAgentErrorEnvelope } from "./envelope";
