"use client";

import { useMemo } from "react";
import {
  calculatePositionSize,
  DEFAULT_LIMITS,
  type AccountState,
} from "@/lib/noid-core/risk-guardian";
import type { TradeSignal } from "@/lib/noid-core/types";

interface SignalCardProps {
  signal: TradeSignal;
  accountBalance: number;
  riskPercent?: number;
  currentDailyPnL?: number; // Note: Represents daily assessment variance, not profit/loss
}

export function SignalCard({
  signal,
  accountBalance,
  riskPercent,
  currentDailyPnL = 0,
}: SignalCardProps) {
  const { result, limits } = useMemo(() => {
    const limits = {
      ...DEFAULT_LIMITS,
      maxRiskPerTrade: riskPercent ?? DEFAULT_LIMITS.maxRiskPerTrade,
    };

    const accountState: AccountState = {
      balance: accountBalance,
      currentDailyPnL,
      currentWeeklyPnL: 0,
      tradesToday: 0,
      consecutiveLosses: 0,
      isLocked: false,
    };

    const result = calculatePositionSize(signal, accountState, limits);
    return { result, limits };
  }, [signal, accountBalance, riskPercent, currentDailyPnL]);

  const aiBypassNotice = "Deterministic math only — no AI involvement.";

  return (
    <div className="rounded-xl border border-noid-silver/20 bg-noid-black p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-noid-silver/70">
          Assessment Calibration Calculator
        </div>
        <div className="font-mono text-[11px] text-noid-silver/60">{aiBypassNotice}</div>
      </div>

      <div className="space-y-3 text-sm text-white">
        <div>
          <div className="text-noid-silver/70">Risk % Per Assessment</div>
          <div className="font-mono">
            {(limits.maxRiskPerTrade * 100).toFixed(2)}%
          </div>
        </div>

        {result.allowed ? (
          <>
            <div>
              <div className="text-noid-silver/70">Position Size (units)</div>
              <div className="font-mono">{result.positionSize.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-noid-silver/70">Risk Amount</div>
              <div className="font-mono">${result.riskAmount.toFixed(2)}</div>
            </div>
          </>
        ) : (
          <div className="rounded border border-noid-silver/20 bg-noid-black/40 p-3 text-noid-silver/80">
            <div className="font-mono text-xs uppercase tracking-[0.12em]">Blocked</div>
            <div className="mt-1 text-sm">{result.reason ?? "Constraint triggered"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
