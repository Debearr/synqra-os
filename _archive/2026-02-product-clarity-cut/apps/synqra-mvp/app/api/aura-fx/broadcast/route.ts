import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logSignal } from "@/lib/aura-fx/tracking";
import { sendTelegramMessage } from "@/lib/aura-fx/telegram";
import { LUXURY_ERROR_MESSAGE } from "@/lib/errors/luxury-handler";

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
  const [cp1, cp2, cp3] = payload.targets ?? [];
  const lines = [
    `<b>AURA-FX DIRECTIONAL ASSESSMENT</b>`,
    `Pair: ${payload.pair}`,
    `Style: ${payload.style}`,
    `Assessed Direction: ${payload.direction}`,
    `Reference Level: ${payload.entry}`,
    `Invalidation Level: ${payload.stop}`,
    cp1 ? `Calibration Point 1: ${cp1}` : null,
    cp2 ? `Calibration Point 2: ${cp2}` : null,
    cp3 ? `Calibration Point 3: ${cp3}` : null,
    payload.reason ? `Assessment Basis: ${payload.reason}` : null,
    `Historical probability analysis only — not financial advice or recommendation`,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
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
    await sendTelegramMessage(message);

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: LUXURY_ERROR_MESSAGE, detail: message }, { status: 500 });
  }
}
