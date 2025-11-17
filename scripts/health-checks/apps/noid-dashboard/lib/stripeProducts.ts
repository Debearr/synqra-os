import { pricingConfig } from "@/lib/config/pricing";
import type { PricingTierSlug, PricingTier, BillingInterval } from "@/types/pricing";

type StripeBillingInterval = Extract<BillingInterval, "weekly" | "monthly">;

type StripeProductConfig = {
  priceId: string;
  campaignsLimit: number | null;
  billingInterval: StripeBillingInterval;
  tier: PricingTier;
};

const ensuredTier = (slug: PricingTierSlug): PricingTier => pricingConfig[slug];

// TODO(stripe): Replace env-driven price IDs with live Stripe product lookups once connected.
export const STRIPE_PRODUCTS: Partial<Record<PricingTierSlug, StripeProductConfig>> = {
  explorer: {
    priceId: process.env.STRIPE_PRICE_EXPLORER ?? "",
    campaignsLimit: ensuredTier("explorer").campaignsPerInterval,
    billingInterval: ensuredTier("explorer").billingInterval as StripeBillingInterval,
    tier: ensuredTier("explorer"),
  },
  creator: {
    priceId: process.env.STRIPE_PRICE_CREATOR ?? "",
    campaignsLimit: ensuredTier("creator").campaignsPerInterval,
    billingInterval: ensuredTier("creator").billingInterval as StripeBillingInterval,
    tier: ensuredTier("creator"),
  },
  team: {
    priceId: process.env.STRIPE_PRICE_TEAM ?? "",
    campaignsLimit: ensuredTier("team").campaignsPerInterval,
    billingInterval: ensuredTier("team").billingInterval as StripeBillingInterval,
    tier: ensuredTier("team"),
  },
  studio: {
    priceId: process.env.STRIPE_PRICE_STUDIO ?? "",
    campaignsLimit: ensuredTier("studio").campaignsPerInterval,
    billingInterval: ensuredTier("studio").billingInterval as StripeBillingInterval,
    tier: ensuredTier("studio"),
  },
};

const PRICE_TO_TIER = Object.entries(STRIPE_PRODUCTS).reduce<Record<string, PricingTierSlug>>(
  (acc, [tier, product]) => {
    if (product?.priceId) {
      acc[product.priceId] = tier as PricingTierSlug;
    }
    return acc;
  },
  {}
);

export function getTierFromPriceId(priceId: string): PricingTierSlug | null {
  return PRICE_TO_TIER[priceId] ?? null;
}
