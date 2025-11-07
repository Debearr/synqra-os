export type BillingInterval = "weekly" | "monthly";

export type TierSlug = "explorer" | "creator" | "team" | "studio";

export type PricingTier = {
  slug: TierSlug;
  label: string;
  price: string;
  billingInterval: BillingInterval;
  campaignsLimit: number;
};

export type PricingConfig = Record<TierSlug, PricingTier>;

export const pricingConfig: PricingConfig = {
  explorer: {
    slug: "explorer",
    label: "Explorer",
    price: "$79 / week",
    billingInterval: "weekly",
    campaignsLimit: 4,
  },
  creator: {
    slug: "creator",
    label: "Creator",
    price: "$197 / month",
    billingInterval: "monthly",
    campaignsLimit: 12,
  },
  team: {
    slug: "team",
    label: "Team",
    price: "$497 / month",
    billingInterval: "monthly",
    campaignsLimit: 40,
  },
  studio: {
    slug: "studio",
    label: "Studio",
    price: "$1,297 / month",
    billingInterval: "monthly",
    campaignsLimit: 100,
  },
};

export const PRICING_SLUGS = Object.keys(pricingConfig) as TierSlug[];
