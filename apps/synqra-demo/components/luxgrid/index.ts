/**
 * LUXGRID UI COMPONENT LIBRARY
 * 
 * First-generation component library for SYNQRA × NØID ecosystem
 * 
 * Design Principles:
 * - Tesla-grade minimalism
 * - Tom Ford precision
 * - Virgil Abloh spacing & typography
 * - Pure matte-black design language
 * - No gradients, shadows, noise, or decoration
 * 
 * @version 1.0.0
 */

export { LuxGridSignature, default as Signature } from "./Signature";
export { LuxGridDivider, default as Divider } from "./Divider";
export { LuxGridPageHeader, default as PageHeader } from "./PageHeader";
export { LuxGridTag, default as Tag } from "./Tag";

// Re-export color system for convenience
export { luxgridColors } from "@/lib/luxgrid/colors";

// Placeholder exports for components in development
// These will be implemented in future iterations
export { LuxGridLogo } from "./placeholders/Logo";
export { LuxGridBarcode } from "./placeholders/Barcode";
export { LuxGridEndCard } from "./placeholders/EndCard";
export { LuxGridCTAButton } from "./placeholders/CTAButton";
export { LuxGridCard } from "./placeholders/Card";
