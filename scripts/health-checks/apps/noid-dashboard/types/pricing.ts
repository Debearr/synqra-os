export type BillingInterval = "monthly" | "weekly" | "custom";

export type PricingTierSlug =
  | "free"
  | "explorer"
  | "creator"
  | "team"
  | "studio"
  | "enterprise";

export type Currency = "USD";

export type CampaignLimit = number | null;

export type TopUpSku = "topup_3" | "topup_10" | "topup_25";

export interface PricingTierCallToAction {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "outline";
  external?: boolean;
  contactOnly?: boolean;
}

export interface PricingTier {
  slug: PricingTierSlug;
  name: string;
  price: number | null;
  priceLabel: string;
  currency: Currency;
  billingInterval: BillingInterval;
  campaignsPerInterval: CampaignLimit;
  intervalLabel: string;
  badge?: string;
  highlight?: boolean;
  description?: string;
  includesWatermark?: boolean;
  maxResolution?: string;
  includesUnlimitedUsers?: boolean;
  supportLevel?: "self-serve" | "concierge" | "dedicated";
  features: string[];
  cta: PricingTierCallToAction;
}

export interface CampaignTopUp {
  sku: TopUpSku;
  price: number;
  currency: Currency;
  campaigns: number;
  label: string;
  description?: string;
}

export interface CampaignUsageSnapshot {
  campaignsUsed: number;
  campaignsLimit: CampaignLimit;
  tier: PricingTierSlug;
  topUpBalance?: number;
  nextRenewalDate?: Date | null;
}

export interface CampaignLimitCheck {
  isAtLimit: boolean;
  remainingCampaigns: number | null;
  message?: string;
}

export type PricingConfig = Record<PricingTierSlug, PricingTier>;
