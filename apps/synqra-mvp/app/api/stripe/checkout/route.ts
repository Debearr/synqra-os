import { NextResponse } from "next/server";
import { generateStripeCheckoutLink } from "sales-engine";

type Payload = {
  email?: string;
  metadata?: Record<string, string>;
  mode?: "subscription" | "payment";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const url = await generateStripeCheckoutLink({
      customerEmail: body.email,
      metadata: body.metadata,
      mode: body.mode,
    });

    if (!url) {
      return NextResponse.json({ ok: false, error: "checkout_unavailable" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("[sales-engine] Stripe checkout route failed", error);
    return NextResponse.json({ ok: false, error: "stripe_checkout_failed" }, { status: 500 });
  }
}
