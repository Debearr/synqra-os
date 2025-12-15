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

    if (broadcast) {
      await sendSignalToTelegram(signal);
    }

    return NextResponse.json({ signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
