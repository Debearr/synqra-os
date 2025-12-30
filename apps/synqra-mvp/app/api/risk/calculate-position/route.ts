import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import { calculatePositionSize, DEFAULT_LIMITS } from "@/lib/noid-core/risk-guardian";
import type { TradeSignal } from "@/lib/noid-core/types";

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

    const accountState = {
      balance: accountBalance,
      currentDailyPnL: 0,
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

    const result = calculatePositionSize(signal as TradeSignal, accountState, limits);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Position calculation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

