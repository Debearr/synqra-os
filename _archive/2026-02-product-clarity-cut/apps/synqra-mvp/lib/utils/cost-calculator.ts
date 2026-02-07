interface CostConfig {
  usdPer1kTokens: number;
}

interface UsageTotals {
  totalTokens: number;
}

export function calculateCostUsd(
  usage: UsageTotals,
  costConfig: CostConfig | undefined
): number {
  if (!costConfig || costConfig.usdPer1kTokens <= 0) {
    return 0;
  }
  const cost = (usage.totalTokens / 1000) * costConfig.usdPer1kTokens;
  return Math.round(cost * 1000000) / 1000000;
}
