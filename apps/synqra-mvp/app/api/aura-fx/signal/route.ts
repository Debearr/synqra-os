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
import {
  AppError,
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

export async function POST(req: NextRequest) {
  const correlationId = ensureCorrelationId(req.headers.get("x-correlation-id"));

  try {
    enforceKillSwitch({ scope: "aura-fx/signal", correlationId });

    const url = new URL(req.url);
    const broadcast = url.searchParams.get("broadcast") === "1";
    const dryRun = url.searchParams.get("dryRun") === "1";

    logSafeguard({
      level: "info",
      message: "aura-fx.signal.start",
      scope: "aura-fx/signal",
      correlationId,
      data: { broadcast, dryRun },
    });

    const body = await req.json();
    const { symbol, timeframe, candles, tzOffsetMinutes } = body as {
      symbol: string;
      timeframe: Timeframe | string;
      candles: Candle[];
      tzOffsetMinutes?: number;
    };

    if (!symbol || !timeframe || !Array.isArray(candles) || candles.length < 3) {
      const normalized = normalizeError(
        new AppError({
          message: "Invalid signal request",
          code: "invalid_request",
          status: 400,
          safeMessage: "symbol, timeframe, and at least 3 candles are required",
          details: { correlationId },
        })
      );

      return NextResponse.json(
        buildAgentErrorEnvelope({
          error: normalized,
          correlationId,
        }),
        { status: normalized.status }
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

    if (broadcast && !dryRun) {
      await sendSignalToTelegram(signal);
    }

    logSafeguard({
      level: "info",
      message: "aura-fx.signal.success",
      scope: "aura-fx/signal",
      correlationId,
      data: { symbol, timeframe, broadcast, dryRun },
    });

    return NextResponse.json({ signal, correlationId, broadcast, dryRun });
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );
    logSafeguard({
      level: "error",
      message: "aura-fx.signal.error",
      scope: "aura-fx/signal",
      correlationId: resolvedCorrelationId,
      data: { code: normalized.code },
    });
    return NextResponse.json(
      buildAgentErrorEnvelope({
        error: normalized,
        correlationId: resolvedCorrelationId,
      }),
      { status: normalized.status }
    );
  }
}
