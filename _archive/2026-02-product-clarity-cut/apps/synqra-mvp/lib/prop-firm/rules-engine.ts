export type ExecutionMode = "public" | "personal";
export type DrawdownLevel = "OK" | "WARNING" | "CRITICAL" | "EMERGENCY";

export interface DrawdownInput {
  previousEodEquity: number;
  balance: number;
  floatingPnl: number;
}

export interface DrawdownResult {
  level: DrawdownLevel;
  drawdownPercent: number;
  baselineEquity: number;
  currentEquity: number;
}

interface PersonalExecutionContext {
  userRole: "founder" | "staff" | "user";
  userHash: string;
}

// Architectural safety: prohibit access in public deployments.
export function assertPersonalExecutionAccess(context: PersonalExecutionContext): void {
  const mode = (process.env.EXECUTION_MODE ?? "public") as ExecutionMode;
  if (mode !== "personal") {
    throw new Error("Personal execution features are disabled in public mode");
  }
  const founderHash = process.env.FOUNDER_HASH;
  if (!founderHash || context.userRole !== "founder" || context.userHash !== founderHash) {
    throw new Error("Personal execution access denied");
  }
}

export function evaluateDrawdown(input: DrawdownInput): DrawdownResult {
  const baselineEquity = input.previousEodEquity;
  if (baselineEquity <= 0) {
    throw new Error("Invalid baseline equity for drawdown evaluation");
  }

  // Safety: always include floating PnL in equity-based drawdown.
  const currentEquity = input.balance + input.floatingPnl;
  const drawdownPercent = Math.max(
    0,
    ((baselineEquity - currentEquity) / baselineEquity) * 100
  );

  let level: DrawdownLevel = "OK";
  if (drawdownPercent >= 9) {
    level = "EMERGENCY";
  } else if (drawdownPercent >= 8) {
    level = "CRITICAL";
  } else if (drawdownPercent >= 7) {
    level = "WARNING";
  }

  return {
    level,
    drawdownPercent,
    baselineEquity,
    currentEquity,
  };
}

// Database-level guard: constrain personal execution to founder-only rows.
export function getFounderDbGuard() {
  const founderHash = process.env.FOUNDER_HASH;
  if (!founderHash) {
    throw new Error("FOUNDER_HASH is required for personal execution data access");
  }
  return { founder_hash: founderHash };
}
