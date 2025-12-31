/**
 * AuraFX Signal API
 * - Computes a confluence-based signal from provided candles.
 * - Side-effect-light by default: returns JSON only.
 * - Telegram broadcast only when query param ?broadcast=1 AND env flag AURAFX_TELEGRAM_ENABLED is set.
 */

import { NextRequest, NextResponse } from "next/server";
import { buildAuraFxContext } from "@/lib/aura-fx/engine";
import { buildSignalPayload } from "@/lib/aura-fx/signalFormatter";
import { sendSignalToTelegram } from "@/lib/aura-fx/telegramClient";
import { Candle, Timeframe } from "@/lib/aura-fx/types";
import { enforceH4TrendGate, type Signal, type TrendState } from "@/lib/aurafx/trend-gate";
import { LUXURY_ERROR_MESSAGE } from "@/lib/errors/luxury-handler";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const broadcast = url.searchParams.get("broadcast") === "1";

    const body = await req.json();
    const { symbol, timeframe, candles, tzOffsetMinutes } = body as {
      symbol: string;
      timeframe: Timeframe | string;
      candles: Candle[];
      tzOffsetMinutes?: number;
    };

    if (!symbol || !timeframe || !Array.isArray(candles) || candles.length < 3) {
      return NextResponse.json(
        { error: "symbol, timeframe, and at least 3 candles are required" },
        { status: 400 }
      );
    }

    const engineResult = buildAuraFxContext({
      candles,
      tzOffsetMinutes: tzOffsetMinutes ?? 0,
    });

    const signal = buildSignalPayload(engineResult, {
      symbol,
      timeframe,
    });

    const signalInput: Signal = { direction: signal.direction };
    const marketTrend: TrendState = {
      direction:
        engineResult.trend.direction === "BULLISH"
          ? "LONG"
          : engineResult.trend.direction === "BEARISH"
          ? "SHORT"
          : "RANGING",
    };

    const trendGate = enforceH4TrendGate(signalInput, marketTrend);

    if (trendGate.status === "SKIPPED") {
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: trendGate.message ?? LUXURY_ERROR_MESSAGE,
          meta: { discipline: "active" },
        },
        { status: 200 }
      );
    }

    if (trendGate.status === "BLOCKED") {
      return NextResponse.json(
        { error: trendGate.message ?? LUXURY_ERROR_MESSAGE },
        { status: 422 }
      );
    }

    if (broadcast) {
      await sendSignalToTelegram(signal);
    }

    return NextResponse.json({ signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: LUXURY_ERROR_MESSAGE, detail: message }, { status: 500 });
  }
}
