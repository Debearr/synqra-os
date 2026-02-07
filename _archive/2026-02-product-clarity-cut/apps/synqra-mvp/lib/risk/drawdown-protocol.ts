import type { DrawdownInput, DrawdownResult, DrawdownLevel } from "@/lib/prop-firm/rules-engine";
import { assertPersonalExecutionAccess, evaluateDrawdown } from "@/lib/prop-firm/rules-engine";

export type DrawdownAction = "allow" | "warn" | "critical" | "freeze";

export interface DrawdownProtocolResult extends DrawdownResult {
  action: DrawdownAction;
  manualOverrideAllowed: false;
}

interface DrawdownProtocolContext {
  userRole: "founder" | "staff" | "user";
  userHash: string;
}

function actionForLevel(level: DrawdownLevel): DrawdownAction {
  switch (level) {
    case "WARNING":
      return "warn";
    case "CRITICAL":
      return "critical";
    case "EMERGENCY":
      return "freeze";
    default:
      return "allow";
  }
}

// Regulatory safety: enforce hard stops with no manual override.
export function applyDrawdownProtocol(
  input: DrawdownInput,
  context: DrawdownProtocolContext
): DrawdownProtocolResult {
  assertPersonalExecutionAccess(context);
  const result = evaluateDrawdown(input);
  const action = actionForLevel(result.level);

  return {
    ...result,
    action,
    manualOverrideAllowed: false,
  };
}
