import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildAuraFxContext } from "@/lib/aura-fx/engine";
import { Candle, Timeframe } from "@/lib/aura-fx/types";
import { LUXURY_ERROR_MESSAGE } from "@/lib/errors/luxury-handler";

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
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
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

    return NextResponse.json({ symbol, timeframe, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: LUXURY_ERROR_MESSAGE, detail: message }, { status: 500 });
  }
}
