import { AvatarProviderName, AvatarPlan } from "../avatar/types";

interface RoutingInput {
  plan: AvatarPlan;
  channel?: "video" | "audio" | "text";
  priority?: "quality" | "speed" | "balanced";
  scriptLength?: number;
}

const providerPreferences: Record<AvatarProviderName, { strength: "speed" | "quality" | "balanced"; maxScript?: number }> = {
  hedra: { strength: "quality", maxScript: 1200 },
  heygen: { strength: "balanced", maxScript: 900 },
  did: { strength: "quality", maxScript: 1400 },
  liveportrait: { strength: "speed", maxScript: 600 },
};

export function selectAvatarProvider(input: RoutingInput): AvatarProviderName {
  const priority = input.priority ?? "balanced";
  const target = (Object.entries(providerPreferences) as [AvatarProviderName, { strength: "speed" | "quality" | "balanced"; maxScript?: number }][]) 
    .map(([provider, meta]) => {
      const fitScore =
        (priority === meta.strength ? 0.6 : 0.3) +
        (input.scriptLength && meta.maxScript ? Math.max(0, 1 - Math.max(0, input.scriptLength - meta.maxScript) / meta.maxScript) * 0.2 : 0) +
        (input.plan === "studio" && (provider === "hedra" || provider === "did") ? 0.1 : 0) +
        (input.plan === "lite" && provider === "liveportrait" ? 0.05 : 0);
      return { provider, score: fitScore };
    })
    .sort((a, b) => b.score - a.score)[0];

  return target.provider;
}
