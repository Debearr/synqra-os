import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getStripeClient, getStripeWebhookSecret, resolveTierFromPriceId } from "@/lib/stripe";
import { updateUserRoleState } from "@/lib/user-role-state";

export const runtime = "nodejs";

function readUserIdFromMetadata(metadata: Stripe.Metadata | null | undefined): string | null {
  if (!metadata) return null;
  const candidates = [metadata.supabase_user_id, metadata.user_id, metadata.userId, metadata.userid];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function asStringId(input: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | null {
  if (!input) return null;
  if (typeof input === "string" && input.trim()) return input.trim();
  if (typeof input === "object" && "id" in input && typeof input.id === "string" && input.id.trim()) {
    return input.id.trim();
  }
  return null;
}

function extractPriceId(subscription: Stripe.Subscription): string | null {
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id;
  return typeof priceId === "string" && priceId.trim() ? priceId.trim() : null;
}

async function resolveUserIdByStripeCustomerId(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const admin = requireSupabaseAdmin();

  const byId = await admin.from("users").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  if (!byId.error && typeof byId.data?.id === "string" && byId.data.id.trim()) {
    return byId.data.id.trim();
  }

  const byUserId = await admin.from("users").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  if (!byUserId.error && typeof byUserId.data?.user_id === "string" && byUserId.data.user_id.trim()) {
    return byUserId.data.user_id.trim();
  }

  return null;
}

async function resolveCheckoutSessionPriceId(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<string | null> {
  if (typeof session.subscription !== "string" || !session.subscription.trim()) {
    return null;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  return extractPriceId(subscription);
}

function buildRedirectSafeError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Unknown webhook processing error";
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "missing_stripe_signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "invalid_stripe_signature", message: buildRedirectSafeError(error) },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const stripe = getStripeClient();
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = asStringId(session.customer);
      const subscriptionId =
        typeof session.subscription === "string" && session.subscription.trim()
          ? session.subscription.trim()
          : null;
      const metadataUserId = readUserIdFromMetadata(session.metadata);
      const userId = metadataUserId ?? (await resolveUserIdByStripeCustomerId(customerId));

      if (!userId) {
        return NextResponse.json({ ok: true, skipped: "user_not_mapped" }, { status: 200 });
      }

      const priceId = await resolveCheckoutSessionPriceId(session, stripe);
      const subscriptionTier = resolveTierFromPriceId(priceId);

      await updateUserRoleState({
        userId,
        role: "subscriber",
        subscriptionTier,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = asStringId(subscription.customer);
      const metadataUserId = readUserIdFromMetadata(subscription.metadata);
      const userId = metadataUserId ?? (await resolveUserIdByStripeCustomerId(customerId));
      if (!userId) {
        return NextResponse.json({ ok: true, skipped: "user_not_mapped" }, { status: 200 });
      }

      await updateUserRoleState({
        userId,
        role: "lapsed",
        subscriptionTier: "none",
        stripeCustomerId: customerId,
        stripeSubscriptionId: null,
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true, ignored: event.type }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "stripe_webhook_processing_failed", message: buildRedirectSafeError(error) },
      { status: 500 }
    );
  }
}

