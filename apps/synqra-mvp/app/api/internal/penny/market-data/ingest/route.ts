import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { enqueuePennyAuraSignalFlowJob } from "@/lib/penny/jobs";
import { persistPennyAuraCandles } from "@/lib/penny/market-data";
import { assertPennyEnabledOrThrow, verifyPennyInternalAccess } from "@/lib/penny/security";

export const runtime = "nodejs";

const candleSchema = z.object({
  time: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().optional(),
});

const bodySchema = z.object({
  ownerId: z.string().uuid(),
  pair: z.string().min(1),
  timeframe: z.string().min(1),
  candles: z.array(candleSchema).min(1),
  source: z.string().optional(),
  enqueueSignalRun: z.boolean().optional(),
  scheduledTime: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  const verification = verifyPennyInternalAccess(request, body);
  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: verification.error }, { status: verification.status });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
  }

  try {
    assertPennyEnabledOrThrow();

    const result = await persistPennyAuraCandles({
      ownerId: parsed.data.ownerId,
      pair: parsed.data.pair,
      timeframe: parsed.data.timeframe,
      candles: parsed.data.candles,
      source: parsed.data.source,
    });

    const shouldEnqueue = parsed.data.enqueueSignalRun ?? true;
    if (!shouldEnqueue || !result.latestCandleTime) {
      return NextResponse.json(
        {
          ok: true,
          ingested: result.count,
          pair: result.pair,
          timeframe: result.timeframe,
          enqueued: false,
        },
        { status: 202 }
      );
    }

    const job = await enqueuePennyAuraSignalFlowJob({
      ownerId: parsed.data.ownerId,
      pair: result.pair,
      timeframe: result.timeframe,
      latestCandleTime: result.latestCandleTime,
      source: parsed.data.source,
      scheduledTime: parsed.data.scheduledTime,
    });

    return NextResponse.json(
      {
        ok: true,
        ingested: result.count,
        pair: result.pair,
        timeframe: result.timeframe,
        enqueued: true,
        duplicateJob: job.duplicate,
        jobId: job.jobId,
        idempotencyKey: job.idempotencyKey,
      },
      { status: 202 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to ingest Penny market data",
      },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
