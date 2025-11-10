import { NextResponse } from "next/server";
import { handleStripeWebhook } from "sales-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await handleStripeWebhook(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[sales-engine] Stripe webhook handler failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
