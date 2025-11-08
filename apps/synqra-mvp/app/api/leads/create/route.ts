import { NextResponse } from "next/server";
import { createLead, type LeadPayload } from "sales-engine";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadPayload;
    const result = await createLead(body);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, lead: result.lead });
  } catch (error) {
    console.error("[sales-engine] Lead create route failed", error);
    return NextResponse.json({ ok: false, error: "lead_create_failed" }, { status: 500 });
  }
}
