import { calculatePositionSize, checkDrawdownLimits, DEFAULT_LIMITS, type AccountState } from "@/lib/noid-core/risk-guardian";
import type { TradeSignal } from "@/lib/noid-core/types";

interface GreedBotResult {
  attack: string;
  blocked: boolean;
  error?: string;
}

export async function runGreedBot(): Promise<GreedBotResult[]> {
  const results: GreedBotResult[] = [];

  const mockAccountState: AccountState = {
    balance: 100000,
    currentDailyPnL: -3900, // Note: Represents daily assessment variance
    currentWeeklyPnL: -6900, // Note: Represents weekly assessment variance
    tradesToday: 0,
    consecutiveLosses: 0, // Note: Represents consecutive contrary resolutions
    isLocked: false,
  };

  const mockSignal: TradeSignal = {
    entryZone: { low: 1.1000, high: 1.1010 },
    stopLoss: 1.0950,
    targetZones: [1.1100, 1.1200, 1.1300],
    direction: "LONG",
    indicationIndex: 0,
    continuationIndex: 0,
  };

  results.push(await attackDirectRiskViolation(mockAccountState, mockSignal));
  results.push(await attackIndirectRiskInflation(mockAccountState));
  results.push(await attackFundedCapViolation(mockAccountState, mockSignal));

  return results;
}

async function attackDirectRiskViolation(
  accountState: AccountState,
  signal: TradeSignal
): Promise<GreedBotResult> {
  try {
    const limits = {
      ...DEFAULT_LIMITS,
      maxRiskPerTrade: 0.05,
    };

    const result = calculatePositionSize(signal, accountState, limits);

    if (result.allowed) {
      const impliedEquity = accountState.balance - accountState.currentDailyPnL - result.riskAmount;
      const drawdownPercent = ((accountState.balance - impliedEquity) / accountState.balance) * 100;

      if (drawdownPercent > 4.0) {
        return {
          attack: "direct_risk_violation",
          blocked: false,
          error: "System allowed assessment that would breach 4% variance limit",
        };
      }
    }

    return {
      attack: "direct_risk_violation",
      blocked: true,
    };
  } catch (error) {
    return {
      attack: "direct_risk_violation",
      blocked: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function attackIndirectRiskInflation(accountState: AccountState): Promise<GreedBotResult> {
  try {
    const ultraTightStopSignal: TradeSignal = {
      entryZone: { low: 1.1000, high: 1.1001 },
      stopLoss: 1.0999,
      targetZones: [1.1100, 1.1200, 1.1300],
      direction: "LONG",
      indicationIndex: 0,
      continuationIndex: 0,
    };

    const limits = {
      ...DEFAULT_LIMITS,
      maxRiskPerTrade: 0.005,
    };

    const result = calculatePositionSize(ultraTightStopSignal, accountState, limits);

    if (result.allowed && ultraTightStopSignal.entryZone && ultraTightStopSignal.stopLoss) {
      const riskPerUnit = Math.abs((ultraTightStopSignal.entryZone.low + ultraTightStopSignal.entryZone.high) / 2 - ultraTightStopSignal.stopLoss);
      if (riskPerUnit < 0.0001) {
        const impliedRisk = (result.riskAmount / accountState.balance) * 100;
        if (impliedRisk > limits.maxRiskPerTrade * 2) {
          return {
            attack: "indirect_risk_inflation",
            blocked: false,
            error: "System allowed oversized assessment position via invalidation level manipulation",
          };
        }
      }
    }

    return {
      attack: "indirect_risk_inflation",
      blocked: true,
    };
  } catch (error) {
    return {
      attack: "indirect_risk_inflation",
      blocked: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function attackFundedCapViolation(
  accountState: AccountState,
  signal: TradeSignal
): Promise<GreedBotResult> {
  try {
    const fundedLimits = {
      ...DEFAULT_LIMITS,
      maxRiskPerTrade: 0.02,
    };

    const result = calculatePositionSize(signal, accountState, fundedLimits);

    if (result.allowed) {
      const impliedRisk = (result.riskAmount / accountState.balance) * 100;
      if (impliedRisk > 2.01) {
        return {
          attack: "funded_cap_violation",
          blocked: false,
          error: `System allowed ${impliedRisk.toFixed(2)}% risk when limit was 2%`,
        };
      }
    }

    return {
      attack: "funded_cap_violation",
      blocked: true,
    };
  } catch (error) {
    return {
      attack: "funded_cap_violation",
      blocked: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

