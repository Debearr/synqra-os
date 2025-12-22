export type TierKey =
  | "FREE"
  | "EXPLORER_WEEKLY"
  | "ATELIER"
  | "COUTURE"
  | "MAISON"
  | "ENTERPRISE"
  | "PRIVATE_INFRA";

export type PricingTier = {
  key: TierKey;
  label: string;
  badge?: string;
  price: string; // display string
  billing: "free" | "weekly" | "monthly" | "custom";
  campaigns?: number; // monthly total (or per-week if weekly)
  campaignsPerWeek?: number;
  seats?: number | "hard_capped";
  flows?: number;
  resolution?: "720p" | "1080p" | "4k";
  watermark?: boolean;
  api?: boolean;
  features: string[];
  cta: { label: string; href: string; intent: "checkout" | "contact" | "topup" | "none" };
  highlight?: boolean;
};

export const TOP_UP_PACKS = [
  { sku: "topup_3", name: "Top-Up 3 Campaigns", price: "$29", campaigns: 3 },
  { sku: "topup_10", name: "Top-Up 10 Campaigns", price: "$79", campaigns: 10 },
  { sku: "topup_25", name: "Top-Up 25 Campaigns", price: "$149", campaigns: 25 },
] as const;

export const PRICING: Record<TierKey, PricingTier> = {
  FREE: {
    key: "FREE",
    label: "Draft",
    price: "$0",
    billing: "free",
    campaigns: 2,
    seats: 1,
    flows: 0,
    resolution: "720p",
    watermark: true,
    api: false,
    features: [
      "Watermarked output",
      "Max 2 campaigns total",
      "Single style/template access",
      "No automation flows",
      "Slower queue (24h)",
    ],
    cta: { label: "Start Free", href: "/signup", intent: "checkout" },
  },
  EXPLORER_WEEKLY: {
    key: "EXPLORER_WEEKLY",
    label: "Explorer (Weekly)",
    badge: "Test Drive",
    price: "$79 / week",
    billing: "weekly",
    campaignsPerWeek: 4,
    seats: 1,
    flows: 1,
    resolution: "1080p",
    watermark: false,
    api: false,
    features: [
      "4 campaigns / week",
      "1 automation flow",
      "Priority over Free tier",
      "Switch to Monthly & save 40%+",
    ],
    cta: { label: "Start Weekly", href: "/checkout/explorer", intent: "checkout" },
  },
  ATELIER: {
    key: "ATELIER",
    label: "Atelier",
    price: "$197 / month",
    billing: "monthly",
    campaigns: 12,
    seats: 1,
    flows: 3,
    resolution: "1080p",
    watermark: false,
    api: false,
    features: [
      "12 campaigns / month",
      "High-res export (1080p)",
      "3 automation flows",
      "Access to premium styles",
    ],
    cta: { label: "Choose Atelier", href: "/checkout/atelier", intent: "checkout" },
  },
  COUTURE: {
    key: "COUTURE",
    label: "Couture",
    badge: "Most Popular",
    price: "$497 / month",
    billing: "monthly",
    campaigns: 40,
    seats: 5,
    flows: 10,
    resolution: "1080p",
    watermark: false,
    api: false,
    features: [
      "40 campaigns / month",
      "5 seats, 10 automation flows",
      "Priority processing",
      "Premium styles & templates",
    ],
    cta: { label: "Choose Couture", href: "/checkout/couture", intent: "checkout" },
    highlight: true,
  },
  MAISON: {
    key: "MAISON",
    label: "Maison",
    price: "$1,297 / month",
    billing: "monthly",
    campaigns: 100,
    seats: "hard_capped",
    flows: 25,
    resolution: "4k",
    watermark: false,
    api: true,
    features: [
      "100 campaigns / month",
      "Hard capped seats for predictable usage and cost control; 25 automation flows",
      "API access (bandwidth-limited)",
      "Dedicated onboarding",
    ],
    cta: { label: "Choose Maison", href: "/checkout/maison", intent: "checkout" },
  },
  ENTERPRISE: {
    key: "ENTERPRISE",
    label: "Enterprise",
    price: "Contact Us",
    billing: "custom",
    features: [
      "Custom SLAs & support",
      "Advanced API & SSO",
      "Security reviews & compliance",
    ],
    cta: { label: "Talk to Sales", href: "/contact", intent: "contact" },
  },
  PRIVATE_INFRA: {
    key: "PRIVATE_INFRA",
    label: "Private Infrastructure",
    price: "From $45,000 / month",
    billing: "custom",
    features: [
      "Dedicated instance / VPC",
      "Custom model training",
      "Highest-level SLAs & security",
    ],
    cta: { label: "Request Proposal", href: "/contact?type=private", intent: "contact" },
  },
};

export const GUARDRAILS = {
  free: { maxCampaigns: 2, maxImages: 10, maxTokens: 5000, rpm: 5, queueDelaySec: 86400, api: false },
  creatorRPH: 100,
  teamRPH: 500,
  studioRPH: 2000,
} as const;

export const ROUTING = {
  llm: { gemini: 0.7, claude: 0.2, gpt4: 0.1 },
  image: { default: "stable-diffusion", premium: "dalle-3" },
} as const;
