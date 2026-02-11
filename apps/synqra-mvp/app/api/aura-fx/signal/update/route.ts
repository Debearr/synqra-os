import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateSignal } from "@/lib/aura-fx/tracking";
import { sendTelegramMessage } from "@/lib/aura-fx/telegram";
import {
  AppError,
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

const statusEnum = z.enum(["open", "tp1", "tp2", "tp3", "closed", "stopped"]);

const bodySchema = z.object({
  id: z.string().uuid(),
  status: statusEnum,
  note: z.string().optional(),
});

function summaryMessage(id: string, status: string, note?: string) {
  const lines = [
    `<b>AURA-FX SIGNAL UPDATE</b>`,
    `ID: ${id}`,
    `Status: ${status}`,
    note ? `Note: ${note}` : null,
    `Educational use only — not financial advice`,
  ].filter(Boolean);
  return lines.join("\n");
}

function lessonFromReason(reason?: string) {
  if (!reason) return ["Review setup vs. execution.", "Track adherence to plan."];
  return [
    `Reason: ${reason}`,
    "Log what worked and what failed for next setup.",
  ];
}

export async function POST(req: NextRequest) {
  const correlationId = ensureCorrelationId(req.headers.get("x-correlation-id"));

  try {
    enforceKillSwitch({ scope: "aura-fx/signal/update", correlationId });

    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "1";

    logSafeguard({
      level: "info",
      message: "aura-fx.signal.update.start",
      scope: "aura-fx/signal/update",
      correlationId,
      data: { dryRun },
    });

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const normalized = normalizeError(
        new AppError({
          message: "Invalid signal update request",
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
    const { id, status, note } = parsed.data;

    await updateSignal(id, status, note);

    if (!dryRun && ["closed", "tp1", "tp2", "tp3", "stopped"].includes(status)) {
      const message = summaryMessage(id, status, note);
      await sendTelegramMessage(message);
    }

    logSafeguard({
      level: "info",
      message: "aura-fx.signal.update.success",
      scope: "aura-fx/signal/update",
      correlationId,
      data: { id, status, dryRun },
    });

    return NextResponse.json({ ok: true, dryRun, correlationId });
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );
    logSafeguard({
      level: "error",
      message: "aura-fx.signal.update.error",
      scope: "aura-fx/signal/update",
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
