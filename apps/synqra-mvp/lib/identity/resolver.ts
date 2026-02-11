/**
 * Identity Resolver Module
 * Production-safe placeholder for identity asset resolution
 * 
 * @module lib/identity/resolver
 */

// Type definitions for identity assets
export interface IdentityAsset {
  type: "logo" | "avatar" | "banner" | "icon";
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export type Surface = "portal" | "dashboard" | "email" | "social" | "mobile";

/**
 * Resolve identity asset for a given surface
 * Returns appropriate branding assets based on surface context
 * 
 * @param surface - The surface context (portal, dashboard, etc.)
 * @returns Identity asset configuration
 */
export function resolveIdentityAssetForSurface(surface: Surface): IdentityAsset {
  // Production placeholder - returns default Synqra branding
  // TODO: Implement actual identity asset resolution from configuration/database
  
  const baseAsset: Omit<IdentityAsset, "url"> = {
    type: "logo",
    alt: "Synqra",
    width: 120,
    height: 40,
  };

  // Surface-specific asset URLs
  const assetUrls: Record<Surface, string> = {
    portal: "/brand/synqra-logo.svg",
    dashboard: "/brand/synqra-logo.svg",
    email: "/brand/synqra-logo-email.png",
    social: "/brand/synqra-social.png",
    mobile: "/brand/synqra-mobile.svg",
  };

  return {
    ...baseAsset,
    url: assetUrls[surface] || assetUrls.portal,
  };
}

/**
 * Get default identity asset
 * @returns Default identity asset
 */
export function getDefaultIdentityAsset(): IdentityAsset {
  return resolveIdentityAssetForSurface("portal");
}

export default resolveIdentityAssetForSurface;
