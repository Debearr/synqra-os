import type { NextApiRequest, NextApiResponse } from "next";
import { STRIPE_PRODUCTS, getTierFromPriceId } from "@/lib/stripeProducts";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function updateSubscriptionProfile(subscription: StripeSubscription): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase environment variables are not configured. Skipping profile update.");
    return;
  }

  const customerId = subscription.customer;
  if (!customerId) {
    console.warn("Subscription payload missing customer identifier.");
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  if (!priceId) {
    console.warn("Subscription payload missing price identifier.");
    return;
  }

  const tier = getTierFromPriceId(priceId);
  if (!tier) {
    console.warn(`No tier mapping found for price ${priceId}.`);
    return;
  }

  const product = STRIPE_PRODUCTS[tier];
  const renewalDate =
    unixTimestampToISOString(subscription.current_period_end) ?? new Date().toISOString();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        tier,
        campaigns_limit: product.campaignsLimit,
        campaigns_used: 0,
        renewal_date: renewalDate,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to update Supabase profile from Stripe webhook:", errorText);
    throw new Error("Supabase profile update failed");
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeWebhookResponse>
): Promise<void> {
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
      case "customer.subscription.updated": {
        const subscription = event.data?.object;
        if (subscription) {
          await updateSubscriptionProfile(subscription);
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
