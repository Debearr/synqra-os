import { pricingConfig } from "@/lib/config/pricing";

void pricingConfig;

export async function checkCampaignLimit(user: any) {
  if (!user) return { ok: false, reason: "unauthenticated" };

  if (user.campaigns_used >= user.campaigns_limit) {
    return { ok: false, reason: "limit_exceeded" };
  }

  return { ok: true };
}
