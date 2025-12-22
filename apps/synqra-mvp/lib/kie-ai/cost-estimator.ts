import { AvatarCostEstimate, AvatarPlan, AvatarUsage } from "../avatar/types";

export const AVATAR_PRICING: Record<AvatarPlan, { monthlyPrice: number; includedVideos: number; perVideoCap: number }> = {
  lite: { monthlyPrice: 67, includedVideos: 3, perVideoCap: 6 },
  pro: { monthlyPrice: 127, includedVideos: 10, perVideoCap: 12 },
  studio: { monthlyPrice: 347, includedVideos: 25, perVideoCap: 15 },
};

export function computeBillingWindow(reference: Date = new Date()): { windowStart: string; windowEnd: string } {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1, 0, 0, 0, 0);
  return { windowStart: start.toISOString(), windowEnd: end.toISOString() };
}

export function estimateAvatarCost(plan: AvatarPlan, usage?: AvatarUsage, requestedVideos = 1): AvatarCostEstimate {
  const config = AVATAR_PRICING[plan];
  const alreadyGenerated = usage?.videosGenerated ?? 0;
  const includedRemaining = Math.max(0, config.includedVideos - alreadyGenerated);
  const billableVideos = Math.max(0, requestedVideos - includedRemaining);
  const perVideoPrice = config.monthlyPrice / config.includedVideos;
  const unitCost = billableVideos > 0 ? Math.min(config.perVideoCap, perVideoPrice) * billableVideos : 0;

  return {
    plan,
    monthlyPrice: config.monthlyPrice,
    includedVideos: config.includedVideos,
    perVideoCap: config.perVideoCap,
    estimatedJobCost: Number(unitCost.toFixed(2)),
    capped: unitCost > 0 && unitCost / billableVideos >= config.perVideoCap,
  };
}

export function projectUsageAfterJob(plan: AvatarPlan, usage: AvatarUsage | null, requestedVideos = 1): AvatarUsage {
  const baseline = usage ?? {
    userId: "unknown",
    plan,
    videosGenerated: 0,
    costToDate: 0,
    ...computeBillingWindow(),
  };

  const costEstimate = estimateAvatarCost(plan, usage ?? undefined, requestedVideos);

  return {
    ...baseline,
    videosGenerated: baseline.videosGenerated + requestedVideos,
    costToDate: Number((baseline.costToDate + costEstimate.estimatedJobCost).toFixed(2)),
  };
}
