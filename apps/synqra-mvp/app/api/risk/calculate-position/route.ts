import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import {
  calculatePositionSize as calculatePositionSizeMath,
  DEFAULT_LIMITS,
  type AccountState,
  type RiskLimits,
} from "@/lib/noid-core/risk-guardian";
import type { TradeSignal } from "@/lib/noid-core/types";
import { LUXURY_ERROR_MESSAGE } from "@/lib/errors/luxury-handler";
import { enforceAntiTiltLockout } from "@/lib/risk/guardian";

interface RiskInputs {
  userId: string;
  signal: TradeSignal;
  accountState: AccountState;
  limits: RiskLimits;
}

async function calculatePositionSize(inputs: RiskInputs) {
  // 1. ANTI-TILT LOCK — FIRST, ALWAYS
  const antiTilt = enforceAntiTiltLockout(inputs.accountState, inputs.limits);

  if (antiTilt.locked) {
    return {
      lots: 0,
      riskAmount: 0,
      isLocked: true,
      message: "SESSION LOCKED: DAILY DRAWDOWN LIMIT REACHED. RECOVER MENTAL CAPITAL.",
    };
  }

  // 2. SAFE TO CALCULATE
  const result = calculatePositionSizeMath(inputs.signal, inputs.accountState, inputs.limits);
  return {
    lots: result.positionSize,
    riskAmount: result.riskAmount,
    isLocked: false,
    message: result.reason,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { signal, accountBalance, riskPercent } = body;

    if (!signal || !accountBalance) {
      return NextResponse.json({ error: "Signal and accountBalance required" }, { status: 400 });
    }

    const { data: account, error: accountError } = await supabase
      .from("user_accounts")
      .select("daily_pnl, daily_loss_limit, is_locked")
      .eq("user_id", user.id)
      .single();

    if (accountError) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const locked =
      account?.is_locked ||
      (account?.daily_pnl !== null &&
        account?.daily_loss_limit !== null &&
        typeof account?.daily_pnl !== "undefined" &&
        typeof account?.daily_loss_limit !== "undefined" &&
        account.daily_pnl <= -account.daily_loss_limit);

    if (locked) {
      return NextResponse.json(
        {
          allowed: false,
          lots: 0,
          message: "SESSION LOCKED: DAILY DRAWDOWN LIMIT REACHED. RECOVER MENTAL CAPITAL.",
        },
        { status: 200 }
      );
    }

    const accountState = {
      balance: accountBalance,
      currentDailyPnL: typeof account?.daily_pnl === "number" ? account.daily_pnl : 0,
      currentWeeklyPnL: 0,
      tradesToday: 0,
      consecutiveLosses: 0,
      isLocked: false,
    };

    const effectiveRisk = riskPercent || DEFAULT_LIMITS.maxRiskPerTrade;
    const limits = {
      ...DEFAULT_LIMITS,
      maxRiskPerTrade: effectiveRisk,
    };

    const result = await calculatePositionSize({
      userId: user.id,
      signal: signal as TradeSignal,
      accountState,
      limits,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Position calculation error:", error);
    return NextResponse.json({ error: LUXURY_ERROR_MESSAGE }, { status: 500 });
  }
}

