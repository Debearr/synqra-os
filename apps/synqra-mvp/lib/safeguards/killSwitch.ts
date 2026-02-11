import { AppError } from "./errors";
import { ensureCorrelationId, logSafeguard } from "./logging";

export type KillSwitchDecision = {
  killed: boolean;
  reason: string;
  correlationId: string;
};

function isEnabled(): boolean {
  return (process.env.SAFEGUARDS_ENABLED ?? "true").toLowerCase() !== "false";
}

function isGlobalKill(): boolean {
  return (process.env.SAFEGUARDS_GLOBAL_KILL ?? "false").toLowerCase() === "true";
}

export function evaluateKillSwitch(options?: {
  scope?: string;
  correlationId?: string | null;
}): KillSwitchDecision {
  const correlationId = ensureCorrelationId(options?.correlationId);

  if (!isEnabled()) {
    return { killed: false, reason: "Safeguards disabled", correlationId };
  }

  if (isGlobalKill()) {
    const reason = "Global kill switch active";
    logSafeguard({
      level: "warn",
      message: reason,
      scope: options?.scope || "kill-switch",
      correlationId,
    });
    return { killed: true, reason, correlationId };
  }

  return { killed: false, reason: "Kill switch off", correlationId };
}

export function enforceKillSwitch(options?: {
  scope?: string;
  correlationId?: string | null;
}) {
  const result = evaluateKillSwitch(options);
  if (result.killed) {
    throw new AppError({
      message: result.reason,
      code: "kill_switch_active",
      status: 503,
      safeMessage:
        "This feature is temporarily paused while we keep things safe. Please try again soon.",
      details: { correlationId: result.correlationId },
    });
  }
}
