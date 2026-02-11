export type TenantVertical = "realtor" | "travel_advisor" | "generic";

export interface TenantContext {
  tenantId: string;
  vertical: TenantVertical;
  source: string;
}

type TenantConfigRecord = Record<string, unknown>;

function toRecord(value: unknown): TenantConfigRecord {
  return typeof value === "object" && value !== null ? (value as TenantConfigRecord) : {};
}

export function normalizeVertical(value: unknown): TenantVertical | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (normalized === "realtor" || normalized === "real_estate" || normalized === "realestate") {
    return "realtor";
  }
  if (
    normalized === "travel_advisor" ||
    normalized === "traveladvisor" ||
    normalized === "travel"
  ) {
    return "travel_advisor";
  }
  if (normalized === "generic") {
    return "generic";
  }
  return null;
}

export function resolveVerticalFromTenantId(tenantId: string): TenantVertical {
  const normalizedTenant = tenantId.trim().toLowerCase();
  const direct = normalizeVertical(normalizedTenant);
  if (direct) return direct;

  if (normalizedTenant.includes("travel")) {
    return "travel_advisor";
  }
  if (normalizedTenant.includes("generic")) {
    return "generic";
  }
  return "realtor";
}

export function resolveTenantFromTenantConfig(
  tenantId: string,
  tenantConfig: unknown
): TenantContext {
  const config = toRecord(tenantConfig);
  const brandVoice = toRecord(config.brand_voice);

  const configuredVertical =
    normalizeVertical(config.vertical) ??
    normalizeVertical(config.tenant_vertical) ??
    normalizeVertical(brandVoice.vertical) ??
    resolveVerticalFromTenantId(tenantId);

  return {
    tenantId,
    vertical: configuredVertical,
    source: "config",
  };
}

export async function resolveTenantForUserId(userId: string): Promise<TenantContext> {
  const inferredVertical = resolveVerticalFromTenantId(userId);
  return {
    tenantId: userId,
    vertical: inferredVertical === "generic" ? "realtor" : inferredVertical,
    source: "user-fallback",
  };
}

export function assertVertical(tenant: TenantContext, expectedVertical: TenantVertical): void {
  if (tenant.vertical !== expectedVertical) {
    throw new Error(`Vertical mismatch: expected ${expectedVertical}, got ${tenant.vertical}`);
  }
}

export function verticalTag(vertical: TenantVertical): string {
  return `[${vertical.toUpperCase()}]`;
}
