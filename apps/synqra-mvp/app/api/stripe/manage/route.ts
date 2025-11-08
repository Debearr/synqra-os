import { NextResponse } from "next/server";
import { updateSubscriptionTier } from "sales-engine";

type Payload = {
  customerId?: string;
  priceId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    if (!body.customerId || !body.priceId) {
      return NextResponse.json({ ok: false, error: "missing_parameters" }, { status: 400 });
    }

    const ok = await updateSubscriptionTier({
      customerId: body.customerId,
      priceId: body.priceId,
    });

    if (!ok) {
      return NextResponse.json({ ok: false, error: "subscription_update_failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[sales-engine] Stripe manage route failed", error);
    return NextResponse.json({ ok: false, error: "stripe_manage_failed" }, { status: 500 });
  }
}
