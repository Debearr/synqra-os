export type IdentityAsset = "system_seal" | "monogram_stamp";

export type Surface =
  | "access"
  | "system_state_indicator"
  | "portal"
  | "dashboard"
  | "email"
  | "social"
  | "mobile";

export type IdentityProfile = "synqra" | "noid" | "aurafx";

const DEFAULT_PROFILE: IdentityProfile = "synqra";
const DEFAULT_ASSET: IdentityAsset = "system_seal";

const SURFACE_DEFAULTS: Record<Surface, IdentityAsset> = {
  access: "monogram_stamp",
  system_state_indicator: "system_seal",
  portal: "system_seal",
  dashboard: "system_seal",
  email: "monogram_stamp",
  social: "monogram_stamp",
  mobile: "monogram_stamp",
};

export function resolveIdentityProfile(value: unknown): IdentityProfile {
  if (typeof value !== "string") return DEFAULT_PROFILE;
  const normalized = value.trim().toLowerCase();
  if (normalized === "synqra" || normalized === "noid" || normalized === "aurafx") {
    return normalized;
  }
  return DEFAULT_PROFILE;
}

export function resolveCreatorStampEnabled(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

export function resolveCreatorStampRuntime(enabled: boolean): string {
  return enabled ? "creator_stamp_on" : "creator_stamp_off";
}

export function buildCouncilSystemInstruction(input: {
  identityProfile: IdentityProfile;
  creatorStampEnabled: boolean;
}): string {
  const profileLine =
    input.identityProfile === "noid"
      ? "Voice profile: NOID (sharp, concise, strategic)."
      : input.identityProfile === "aurafx"
        ? "Voice profile: AuraFX (signal-aware, analytical, precise)."
        : "Voice profile: Synqra (clear, executive, direct).";
  const creatorStampLine = input.creatorStampEnabled
    ? "Append creator stamp metadata at the end of outputs."
    : "Do not append creator stamp metadata.";

  return [
    "You are Synqra Council, a production content engine.",
    profileLine,
    "Never fabricate facts. Keep responses operational and concrete.",
    creatorStampLine,
  ].join("\n");
}

export function resolveIdentityAssetForSurface(
  surface: Surface | string,
  preferredAssets?: IdentityAsset[]
): IdentityAsset {
  const normalizedSurface = surface.trim().toLowerCase() as Surface;
  const defaultAsset = SURFACE_DEFAULTS[normalizedSurface] ?? DEFAULT_ASSET;
  if (preferredAssets && preferredAssets.length > 0) {
    return preferredAssets.includes(defaultAsset) ? defaultAsset : preferredAssets[0];
  }
  return defaultAsset;
}

export function getDefaultIdentityAsset(): IdentityAsset {
  return DEFAULT_ASSET;
}

export default resolveIdentityAssetForSurface;
