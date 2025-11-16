import type { NextApiRequest, NextApiResponse } from "next";
import { STRIPE_PRODUCTS, getTierFromPriceId } from "@/lib/stripeProducts";
import {
  resolveCampaignLimit,
  syncSubscriptionProfile,
} from "@/lib/subscription";
import { isSupabaseAvailable } from "@/lib/supabase";
import type { PricingTierSlug } from "@/types/pricing";

export const config = {
  api: {
    bodyParser: false,
  },
};

type StripeWebhookResponse = { received: boolean } | { error: string };

type StripeSubscriptionItem = {
  price?: {
    id?: string | null;
  } | null;
};

type StripeSubscription = {
  customer?: string | null;
  current_period_end?: number | null;
  items?: {
    data?: StripeSubscriptionItem[] | null;
  } | null;
};

type StripeEvent = {
  type?: string;
  data?: {
    object?: StripeSubscription | null;
  } | null;
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

function unixTimestampToISOString(timestamp: number | null | undefined): string | null {
  if (!timestamp || Number.isNaN(timestamp)) return null;
  return new Date(timestamp * 1000).toISOString();
}

async function handleSubscriptionSync(
  subscription: StripeSubscription,
  fallbackTier?: PricingTierSlug
): Promise<void> {
  if (!isSupabaseAvailable()) {
    console.warn("Supabase environment variables are not configured. Skipping profile update.");
    return;
  }

  const customerId = subscription.customer;
  if (!customerId) {
    console.warn("Subscription payload missing customer identifier.");
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  let tier: PricingTierSlug | null = fallbackTier ?? null;

  if (!tier && priceId) {
    tier = getTierFromPriceId(priceId);
  }

  if (!tier) {
    console.warn(
      `No tier mapping found for subscription ${subscription?.customer ?? "unknown"}`
    );
    return;
  }

  const product = STRIPE_PRODUCTS[tier];

  if (!product && tier !== "free") {
    console.warn(`Missing Stripe product configuration for tier ${tier}.`);
    return;
  }

  const campaignsLimit = resolveCampaignLimit(tier, product?.campaignsLimit ?? null);
  const renewalDate =
    unixTimestampToISOString(subscription.current_period_end) ?? new Date().toISOString();

  await syncSubscriptionProfile(customerId, tier, campaignsLimit, renewalDate);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeWebhookResponse>
): Promise<void> {
  // TODO(stripe): Validate webhook signature using Stripe SDK once credentials are provisioned.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  let event: StripeEvent;
  try {
    const rawBody = await readRawBody(req);
    event = JSON.parse(rawBody.toString("utf8")) as StripeEvent;
  } catch (error) {
    console.error("Stripe webhook payload parsing failed", error);
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  if (!event?.type) {
    res.status(400).json({ error: "Missing event type" });
    return;
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data?.object;
        if (subscription) {
          await handleSubscriptionSync(subscription);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data?.object;
        if (subscription) {
          await handleSubscriptionSync(subscription, "free");
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handling failed", error);
    res.status(500).json({ error: "Webhook handling failed" });
    return;
  }

  res.status(200).json({ received: true });
}
