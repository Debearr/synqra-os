import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { TenantVertical } from "@/lib/verticals/tenant";

export type SubscriptionState = "free" | "pro";

export type RealtorBillingProfile = {
  tier: SubscriptionState;
  usageMonth: string;
  assetsGeneratedThisMonth: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeSubscriptionStatus: string | null;
  lastPaymentFailedAt: string | null;
  updatedAt: string | null;
};

export type BillingAllowance = {
  allowed: boolean;
  state: SubscriptionState;
  monthlyLimit: number | null;
  monthlyUsed: number;
  monthlyRemaining: number | null;
};

const LEGACY_REALTOR_BILLING_METADATA_KEY = "realtor_billing";
const VERTICAL_BILLING_METADATA_KEY = "synqra_vertical_billing";
const DEFAULT_VERTICAL: TenantVertical = "realtor";

export const FREE_TIER_MONTHLY_ASSET_LIMIT = 5;
export const PRO_TIER_MONTHLY_PRICE_CAD = 49;
export const FREE_TIER_LIMIT_EXCEEDED_ERROR =
  "Free tier limit reached (5 assets/month). Upgrade to Pro ($49 CAD/month) to continue.";

function normalizeMonth(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseSubscriptionState(value: unknown): SubscriptionState {
  if (value === "pro") {
    return "pro";
  }
  return "free";
}

function toFiniteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function readBillingContainer(metadata: Record<string, unknown>): Record<string, unknown> {
  return asRecord(metadata[VERTICAL_BILLING_METADATA_KEY]);
}

function readBillingEntry(metadata: Record<string, unknown>, vertical: TenantVertical): Record<string, unknown> {
  const container = readBillingContainer(metadata);
  const scoped = asRecord(container[vertical]);
  if (Object.keys(scoped).length > 0) {
    return scoped;
  }

  if (vertical === "realtor") {
    const legacy = asRecord(metadata[LEGACY_REALTOR_BILLING_METADATA_KEY]);
    if (Object.keys(legacy).length > 0) {
      return legacy;
    }
  }
  return {};
}

function writeBillingEntry(
  metadata: Record<string, unknown>,
  vertical: TenantVertical,
  entry: Record<string, unknown>
): Record<string, unknown> {
  const container = readBillingContainer(metadata);
  const nextContainer = {
    ...container,
    [vertical]: entry,
  };

  return {
    ...metadata,
    [VERTICAL_BILLING_METADATA_KEY]: nextContainer,
    ...(vertical === "realtor" ? { [LEGACY_REALTOR_BILLING_METADATA_KEY]: entry } : {}),
  };
}

function readBillingProfileFromMetadata(
  metadata: Record<string, unknown>,
  vertical: TenantVertical,
  now = new Date()
): RealtorBillingProfile {
  const entry = readBillingEntry(metadata, vertical);
  const usageMonth = typeof entry.usage_month === "string" ? entry.usage_month : normalizeMonth(now);

  return {
    tier: parseSubscriptionState(entry.tier),
    usageMonth,
    assetsGeneratedThisMonth: toFiniteNumber(entry.assets_generated_this_month),
    stripeCustomerId: typeof entry.stripe_customer_id === "string" ? entry.stripe_customer_id : null,
    stripeSubscriptionId: typeof entry.stripe_subscription_id === "string" ? entry.stripe_subscription_id : null,
    stripePriceId: typeof entry.stripe_price_id === "string" ? entry.stripe_price_id : null,
    stripeSubscriptionStatus:
      typeof entry.stripe_subscription_status === "string" ? entry.stripe_subscription_status : null,
    lastPaymentFailedAt: typeof entry.last_payment_failed_at === "string" ? entry.last_payment_failed_at : null,
    updatedAt: typeof entry.updated_at === "string" ? entry.updated_at : null,
  };
}

async function fetchUserMetadata(userId: string): Promise<Record<string, unknown>> {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error("Unable to load account billing metadata.");
  }

  return asRecord(data.user.user_metadata);
}

async function writeVerticalBillingEntry(
  userId: string,
  vertical: TenantVertical,
  mutate: (current: Record<string, unknown>) => Record<string, unknown>
): Promise<void> {
  const admin = requireSupabaseAdmin();
  const existingMetadata = await fetchUserMetadata(userId);
  const currentEntry = readBillingEntry(existingMetadata, vertical);
  const nextEntry = mutate(currentEntry);
  const nextMetadata = writeBillingEntry(existingMetadata, vertical, nextEntry);

  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: nextMetadata,
  });

  if (error) {
    throw new Error(`Unable to persist billing metadata: ${error.message}`);
  }
}

export async function getRealtorBillingProfile(
  userId: string,
  now = new Date(),
  vertical: TenantVertical = DEFAULT_VERTICAL
): Promise<RealtorBillingProfile> {
  const metadata = await fetchUserMetadata(userId);
  return readBillingProfileFromMetadata(metadata, vertical, now);
}

export async function resolveSubscriptionState(
  userId: string,
  vertical: TenantVertical = DEFAULT_VERTICAL
): Promise<SubscriptionState> {
  const profile = await getRealtorBillingProfile(userId, new Date(), vertical);
  return profile.tier;
}

export async function checkRealtorBillingAllowance(
  userId: string,
  requestedAssetCount: number,
  now = new Date(),
  vertical: TenantVertical = DEFAULT_VERTICAL
): Promise<BillingAllowance> {
  const normalizedRequested = Math.max(1, Math.floor(requestedAssetCount));
  const profile = await getRealtorBillingProfile(userId, now, vertical);
  const currentMonth = normalizeMonth(now);
  const used = profile.usageMonth === currentMonth ? profile.assetsGeneratedThisMonth : 0;

  if (profile.tier === "pro") {
    return {
      allowed: true,
      state: "pro",
      monthlyLimit: null,
      monthlyUsed: used,
      monthlyRemaining: null,
    };
  }

  const remaining = Math.max(0, FREE_TIER_MONTHLY_ASSET_LIMIT - used);
  return {
    allowed: used + normalizedRequested <= FREE_TIER_MONTHLY_ASSET_LIMIT,
    state: "free",
    monthlyLimit: FREE_TIER_MONTHLY_ASSET_LIMIT,
    monthlyUsed: used,
    monthlyRemaining: remaining,
  };
}

export async function recordRealtorGenerationUsage(
  userId: string,
  assetCount: number,
  generatedAtIso?: string,
  vertical: TenantVertical = DEFAULT_VERTICAL
): Promise<void> {
  const incrementBy = Math.max(1, Math.floor(assetCount));
  const now = generatedAtIso ? new Date(generatedAtIso) : new Date();
  const month = normalizeMonth(now);

  await writeVerticalBillingEntry(userId, vertical, (current) => {
    const tier = parseSubscriptionState(current.tier);
    const existingMonth = typeof current.usage_month === "string" ? current.usage_month : month;
    const existingCount = toFiniteNumber(current.assets_generated_this_month);
    const nextCount = existingMonth === month ? existingCount + incrementBy : incrementBy;

    return {
      ...current,
      tier,
      usage_month: month,
      assets_generated_this_month: nextCount,
      updated_at: now.toISOString(),
    };
  });
}

