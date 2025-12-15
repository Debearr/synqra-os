import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logSignal } from "@/lib/aura-fx/tracking";
import { sendTelegramMessage } from "@/lib/aura-fx/telegram";

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
