import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildAuraFxContext } from "@/lib/aura-fx/engine";
import { Candle, Timeframe } from "@/lib/aura-fx/types";
import {
  AppError,
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

const candleSchema = z.object({
  time: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().optional(),
  timeframe: z.string().optional(),
});

const bodySchema = z.object({
  symbol: z.string(),
  timeframe: z.string(),
  candles: z.array(candleSchema).min(3),
  tzOffsetMinutes: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const correlationId = ensureCorrelationId(req.headers.get("x-correlation-id"));

  try {
    logSafeguard({
      level: "info",
      message: "aura-fx.analyze.start",
      scope: "aura-fx/analyze",
      correlationId,
    });

    enforceKillSwitch({ scope: "aura-fx/analyze", correlationId });

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const normalized = normalizeError(
        new AppError({
          message: "Invalid AuraFX analyze request",
          code: "invalid_request",
          status: 400,
          safeMessage: parsed.error.message,
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

    const { symbol, timeframe, candles, tzOffsetMinutes } = parsed.data as {
      symbol: string;
      timeframe: Timeframe | string;
      candles: Candle[];
      tzOffsetMinutes?: number;
    };

    const result = buildAuraFxContext({
      candles,
      tzOffsetMinutes: tzOffsetMinutes ?? 0,
    });

    logSafeguard({
      level: "info",
      message: "aura-fx.analyze.success",
      scope: "aura-fx/analyze",
      correlationId,
      data: { symbol, timeframe },
    });

    return NextResponse.json({ symbol, timeframe, result, correlationId });
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );
    logSafeguard({
      level: "error",
      message: "aura-fx.analyze.error",
      scope: "aura-fx/analyze",
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
