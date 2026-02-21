import Stripe from "stripe";

export const TIER_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_CORE!]: "core",
  [process.env.STRIPE_PRICE_PRO!]: "pro",
  [process.env.STRIPE_PRICE_STUDIO_PLUS!]: "studio_plus",
};

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required");
  }
  return secret;
}

export function resolveTierFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return "none";
  const resolved = TIER_MAP[priceId];
  return typeof resolved === "string" && resolved.trim() ? resolved : "none";
}

