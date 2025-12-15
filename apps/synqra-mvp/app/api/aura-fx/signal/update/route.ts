import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateSignal } from "@/lib/aura-fx/tracking";
import { sendTelegramMessage } from "@/lib/aura-fx/telegram";

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
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const { id, status, note } = parsed.data;

    await updateSignal(id, status, note);

    if (["closed", "tp1", "tp2", "tp3", "stopped"].includes(status)) {
      const message = summaryMessage(id, status, note);
      await sendTelegramMessage(message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
