import type { PricingTierSlug } from "@/types/pricing";
import {
  calculateCampaignLimitCheck,
  resolveCampaignLimit,
  resolveTierSlug,
} from "@/lib/subscription";

type CampaignUsageInput = {
  tier?: PricingTierSlug | null;
  campaigns_used?: number | null;
  campaigns_limit?: number | null;
};

type CampaignLimitCheckResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "limit_exceeded" };

export async function checkCampaignLimit(
  user: CampaignUsageInput | null | undefined
): Promise<CampaignLimitCheckResult> {
  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const tier = resolveTierSlug(user.tier);
  const campaignsUsed = Number(user.campaigns_used ?? 0);
  const campaignsLimit = resolveCampaignLimit(tier, user.campaigns_limit ?? null);

  const limitCheck = calculateCampaignLimitCheck({
    campaignsUsed,
    campaignsLimit,
    tier,
    nextRenewalDate: null,
  });

  if (limitCheck.isAtLimit) {
    return { ok: false, reason: "limit_exceeded" };
  }

  return { ok: true };
}
