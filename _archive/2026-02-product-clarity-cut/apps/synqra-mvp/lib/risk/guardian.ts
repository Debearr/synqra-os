/**
 * Risk Guardian
 * 
 * TODO: Implement anti-tilt lockout system
 * - Track consecutive losses
 * - Enforce daily/weekly drawdown limits
 * - Lock account when limits exceeded
 */

import type { AccountState, RiskLimits } from "@/lib/noid-core/risk-guardian";

export interface AntiTiltResult {
  locked: boolean;
  message?: string;
}

/**
 * Enforces anti-tilt lockout based on account state and limits
 * 
 * TODO: Implement actual anti-tilt logic
 * - Check daily/weekly drawdown limits
 * - Track consecutive losses
 * - Lock account when thresholds exceeded
 */
export function enforceAntiTiltLockout(
  accountState: AccountState,
  limits: RiskLimits
): AntiTiltResult {
  // Stub implementation: check basic lock state
  // TODO: Implement full anti-tilt logic
  if (accountState.isLocked) {
    return {
      locked: true,
      message: "Account is locked.",
    };
  }

  // Check daily loss limit (stub)
  if (accountState.currentDailyPnL <= -limits.maxDailyLoss * accountState.balance) {
    return {
      locked: true,
      message: "Daily loss limit reached.",
    };
  }

  // Check consecutive losses (stub)
  if (accountState.consecutiveLosses >= limits.maxConsecutiveLosses) {
    return {
      locked: true,
      message: "Maximum consecutive losses reached.",
    };
  }

  return {
    locked: false,
  };
}
