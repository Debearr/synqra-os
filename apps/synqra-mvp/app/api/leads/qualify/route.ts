import { NextResponse } from "next/server";
import { qualifyLead, type LeadPayload } from "sales-engine";

type Payload = LeadPayload & { id: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    if (!body.id) {
      return NextResponse.json({ ok: false, error: "missing_lead_id" }, { status: 400 });
    }

    const result = await qualifyLead(body);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, qualification: result.qualification });
  } catch (error) {
    console.error("[sales-engine] Lead qualify route failed", error);
    return NextResponse.json({ ok: false, error: "lead_qualify_failed" }, { status: 500 });
  }
}
