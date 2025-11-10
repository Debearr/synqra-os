import { NextResponse } from "next/server";
import { activateUser, type LeadPayload } from "sales-engine";

type Payload = {
  userId: string;
  lead: LeadPayload & { id: string };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    if (!body.userId || !body.lead?.id) {
      return NextResponse.json({ ok: false, error: "missing_parameters" }, { status: 400 });
    }

    const result = await activateUser({
      userId: body.userId,
      lead: body.lead,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "activation_failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, plan: result.plan });
  } catch (error) {
    console.error("[sales-engine] User activate route failed", error);
    return NextResponse.json({ ok: false, error: "user_activate_failed" }, { status: 500 });
  }
}
