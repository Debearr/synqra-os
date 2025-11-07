import { pricingConfig, type BillingInterval, type TierSlug } from "@/lib/config/pricing";

type StripeProductConfig = {
  priceId: string;
  campaignsLimit: number;
  billingInterval: BillingInterval;
};

export const STRIPE_PRODUCTS: Record<TierSlug, StripeProductConfig> = {
  explorer: {
    priceId: process.env.STRIPE_PRICE_EXPLORER ?? "",
    campaignsLimit: pricingConfig.explorer.campaignsLimit,
    billingInterval: pricingConfig.explorer.billingInterval,
  },
  creator: {
    priceId: process.env.STRIPE_PRICE_CREATOR ?? "",
    campaignsLimit: pricingConfig.creator.campaignsLimit,
    billingInterval: pricingConfig.creator.billingInterval,
  },
  team: {
    priceId: process.env.STRIPE_PRICE_TEAM ?? "",
    campaignsLimit: pricingConfig.team.campaignsLimit,
    billingInterval: pricingConfig.team.billingInterval,
  },
  studio: {
    priceId: process.env.STRIPE_PRICE_STUDIO ?? "",
    campaignsLimit: pricingConfig.studio.campaignsLimit,
    billingInterval: pricingConfig.studio.billingInterval,
  },
};

const PRICE_TO_TIER = Object.entries(STRIPE_PRODUCTS).reduce(
  (acc, [tier, product]) => {
    if (product.priceId) {
      acc[product.priceId] = tier as TierSlug;
    }
    return acc;
  },
  {} as Record<string, TierSlug>
);

export function getTierFromPriceId(priceId: string): TierSlug | null {
  return PRICE_TO_TIER[priceId] ?? null;
}
