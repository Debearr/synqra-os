import { pricingConfig, DEFAULT_FALLBACK_TIER } from "@/lib/config/pricing";
import {
  getProfileByStripeCustomerId,
  isSupabaseAvailable,
  type ProfileRow,
  updateProfileSubscription,
} from "@/lib/supabase";
import type {
  CampaignLimit,
  CampaignLimitCheck,
  CampaignUsageSnapshot,
  PricingTier,
  PricingTierSlug,
} from "@/types/pricing";

const FALLBACK_TIER: PricingTierSlug = DEFAULT_FALLBACK_TIER;

export function resolveTierSlug(candidate: string | null | undefined): PricingTierSlug {
  if (!candidate) return FALLBACK_TIER;
  return (candidate in pricingConfig ? candidate : FALLBACK_TIER) as PricingTierSlug;
}

export function resolveCampaignLimit(
  tier: PricingTierSlug,
  override: CampaignLimit
): CampaignLimit {
  if (typeof override === "number") {
    return override;
  }

  return pricingConfig[tier].campaignsPerInterval ?? null;
}

export function getTierDetails(tier: PricingTierSlug): PricingTier {
  return pricingConfig[tier] ?? pricingConfig[FALLBACK_TIER];
}

export function createCampaignUsageSnapshotFromProfile(
  profile: ProfileRow | null
): CampaignUsageSnapshot {
  const tier = resolveTierSlug(profile?.tier ?? null);
  const campaignsUsed = Number(profile?.campaigns_used ?? 0);
  const campaignsLimit = resolveCampaignLimit(tier, profile?.campaigns_limit ?? null);
  const nextRenewalDate = profile?.renewal_date
    ? new Date(profile.renewal_date)
    : null;

  return {
    tier,
    campaignsUsed,
    campaignsLimit,
    nextRenewalDate,
  };
}

export function calculateCampaignLimitCheck(
  snapshot: CampaignUsageSnapshot
): CampaignLimitCheck {
  if (snapshot.campaignsLimit === null) {
    return {
      isAtLimit: false,
      remainingCampaigns: null,
    };
  }

  const remainingCampaigns = Math.max(
    snapshot.campaignsLimit - snapshot.campaignsUsed,
    0
  );

  return {
    isAtLimit: remainingCampaigns <= 0,
    remainingCampaigns,
    message:
      remainingCampaigns <= 0
        ? "Campaign limit reached. Upgrade tier or purchase a top-up."
        : undefined,
  };
}

export async function getCampaignUsageSnapshot(
  stripeCustomerId: string | null
): Promise<CampaignUsageSnapshot> {
  if (!stripeCustomerId || !isSupabaseAvailable()) {
    return createCampaignUsageSnapshotFromProfile(null);
  }

  try {
    const profile = await getProfileByStripeCustomerId(stripeCustomerId);
    return createCampaignUsageSnapshotFromProfile(profile);
  } catch (error) {
    console.error("Failed to fetch campaign usage snapshot", error);
    return createCampaignUsageSnapshotFromProfile(null);
  }
}

export async function syncSubscriptionProfile(
  stripeCustomerId: string,
  tier: PricingTierSlug,
  campaignsLimit: CampaignLimit,
  renewalDateIso: string
): Promise<void> {
  // TODO(stripe): Populate campaigns_used with actual usage sourced from Stripe once metered billing is enabled.
  await updateProfileSubscription(stripeCustomerId, {
    tier,
    campaignsLimit,
    renewalDate: renewalDateIso,
    campaignsUsed: 0,
  });
}

// TODO(stripe): Replace demo customer fallback with authenticated user's Stripe customer mapping.
export function getDemoStripeCustomerId(): string | null {
  return process.env.NEXT_PUBLIC_DEMO_STRIPE_CUSTOMER_ID ?? null;
}
