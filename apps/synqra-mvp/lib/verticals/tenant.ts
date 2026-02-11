/**
 * Tenant Verticals Module
 * Production-safe placeholder for tenant vertical management
 * 
 * @module lib/verticals/tenant
 */

// Supported tenant verticals
export type TenantVertical = "realtor" | "generic";

interface Tenant {
  tenantId: string;
  vertical: TenantVertical;
  source: string;
}

/**
 * Normalize vertical string to TenantVertical type
 * @param value - Raw vertical value
 * @returns Normalized TenantVertical or null
 */
export function normalizeVertical(value: unknown): TenantVertical | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase().trim();
  if (normalized === "realtor" || normalized === "real_estate" || normalized === "realestate") {
    return "realtor";
  }
  if (normalized === "generic") {
    return "generic";
  }
  return null;
}

/**
 * Resolve tenant for user ID
 * @param userId - User ID
 * @returns Tenant information
 */
export async function resolveTenantForUserId(userId: string): Promise<Tenant> {
  // Production placeholder - returns generic tenant
  // TODO: Implement actual tenant resolution from database
  return {
    tenantId: userId,
    vertical: "generic",
    source: "default",
  };
}

/**
 * Assert vertical matches expected
 * @param tenant - Tenant to validate
 * @param expectedVertical - Expected vertical
 * @throws Error if vertical mismatch
 */
export function assertVertical(tenant: Tenant, expectedVertical: TenantVertical): void {
  if (tenant.vertical !== expectedVertical) {
    throw new Error(
      `Vertical mismatch: expected ${expectedVertical}, got ${tenant.vertical}`
    );
  }
}

/**
 * Get vertical display tag
 * @param vertical - Vertical to tag
 * @returns Display tag for vertical
 */
export function verticalTag(vertical: TenantVertical): string {
  return `[${vertical.toUpperCase()}]`;
}
