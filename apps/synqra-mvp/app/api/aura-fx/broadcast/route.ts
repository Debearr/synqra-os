import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logSignal } from "@/lib/aura-fx/tracking";
import { sendTelegramMessage } from "@/lib/aura-fx/telegram";
import {
  AppError,
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

const bodySchema = z.object({
  pair: z.string(),
  style: z.string(),
  direction: z.string(),
  entry: z.string(),
  stop: z.string(),
  targets: z.array(z.string()).max(3).optional(),
  reason: z.string().optional(),
});

function formatMessage(payload: z.infer<typeof bodySchema>): string {
  const [tp1, tp2, tp3] = payload.targets ?? [];
  const lines = [
    `<b>AURA-FX SIGNAL</b>`,
    `Pair: ${payload.pair}`,
    `Style: ${payload.style}`,
    `Direction: ${payload.direction}`,
    `Entry: ${payload.entry}`,
    `Stop: ${payload.stop}`,
    tp1 ? `TP1: ${tp1}` : null,
    tp2 ? `TP2: ${tp2}` : null,
    tp3 ? `TP3: ${tp3}` : null,
    payload.reason ? `Reason: ${payload.reason}` : null,
    `Educational use only — not financial advice`,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const correlationId = ensureCorrelationId(req.headers.get("x-correlation-id"));

  try {
    enforceKillSwitch({ scope: "aura-fx/broadcast", correlationId });

    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "1";

    logSafeguard({
      level: "info",
      message: "aura-fx.broadcast.start",
      scope: "aura-fx/broadcast",
      correlationId,
      data: { dryRun },
    });

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const normalized = normalizeError(
        new AppError({
          message: "Invalid broadcast request",
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
    const payload = parsed.data;

    const id = await logSignal({
      pair: payload.pair,
      style: payload.style,
      direction: payload.direction,
      entry: payload.entry,
      stop: payload.stop,
      tp1: payload.targets?.[0],
      tp2: payload.targets?.[1],
      tp3: payload.targets?.[2],
      reason: payload.reason,
    });

    const message = formatMessage(payload);
    if (!dryRun) {
      await sendTelegramMessage(message);
    }

    logSafeguard({
      level: "info",
      message: "aura-fx.broadcast.success",
      scope: "aura-fx/broadcast",
      correlationId,
      data: { id, dryRun },
    });

    return NextResponse.json({ ok: true, id, dryRun, correlationId });
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );
    logSafeguard({
      level: "error",
      message: "aura-fx.broadcast.error",
      scope: "aura-fx/broadcast",
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
