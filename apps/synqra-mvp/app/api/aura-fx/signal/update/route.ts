import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateSignal } from "@/lib/aura-fx/tracking";
import { sendTelegramMessage } from "@/lib/aura-fx/telegram";

const statusEnum = z.enum(["UNRESOLVED", "PARTIAL_RESOLUTION_1", "PARTIAL_RESOLUTION_2", "PARTIAL_RESOLUTION_3", "RESOLVED_AS_ASSESSED", "RESOLVED_CONTRARY"]);

const bodySchema = z.object({
  id: z.string().uuid(),
  status: statusEnum,
  note: z.string().optional(),
});

function summaryMessage(id: string, status: string, note?: string) {
  const lines = [
    `<b>AURA-FX ASSESSMENT UPDATE</b>`,
    `ID: ${id}`,
    `Calibration Status: ${status}`,
    note ? `Note: ${note}` : null,
    `Historical analysis only — not financial advice or recommendation`,
  ].filter(Boolean);
  return lines.join("\n");
}

function lessonFromReason(reason?: string) {
  if (!reason) return ["Review assessment methodology vs. historical outcome.", "Track calibration accuracy over time."];
  return [
    `Reason: ${reason}`,
    "Document directional assessment factors for future calibration analysis.",
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

    if (["RESOLVED_AS_ASSESSED", "PARTIAL_RESOLUTION_1", "PARTIAL_RESOLUTION_2", "PARTIAL_RESOLUTION_3", "RESOLVED_CONTRARY"].includes(status)) {
      const message = summaryMessage(id, status, note);
      await sendTelegramMessage(message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
