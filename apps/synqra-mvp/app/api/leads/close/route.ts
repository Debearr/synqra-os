import { NextResponse } from "next/server";
import { closeLead, type LeadPayload } from "sales-engine";

type Payload = LeadPayload & { id: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    if (!body.id) {
      return NextResponse.json({ ok: false, error: "missing_lead_id" }, { status: 400 });
    }

    const result = await closeLead(body);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, plan: result.plan });
  } catch (error) {
    console.error("[sales-engine] Lead close route failed", error);
    return NextResponse.json({ ok: false, error: "lead_close_failed" }, { status: 500 });
  }
}
