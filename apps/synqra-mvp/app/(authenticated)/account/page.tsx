import { createClient } from "@/utils/supabase/server";

type PlanBadge = "PILOT" | "CORE" | "PRO" | "STUDIO";

type SessionUserLike = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function getSessionUserSafely(scope: string): Promise<SessionUserLike | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error(`[${scope}] Supabase auth.getUser failed:`, error.message);
      return null;
    }
    return (data?.user as SessionUserLike | null) ?? null;
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.toLowerCase().includes("ref mismatch")) {
      console.error(`[${scope}] Supabase environment mismatch: ${message}`);
    } else {
      console.error(`[${scope}] Supabase session initialization failed: ${message}`);
    }
    return null;
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function resolvePlanBadge(user: SessionUserLike | null): PlanBadge {
  if (!user) return "PILOT";

  const tier = readString(user.app_metadata?.subscription_tier ?? user.user_metadata?.subscription_tier);
  const role = readString(user.app_metadata?.role ?? user.user_metadata?.role);

  if (tier.includes("studio")) return "STUDIO";
  if (tier.includes("pro")) return "PRO";
  if (tier.includes("core")) return "CORE";
  if (role === "subscriber") return "CORE";
  return "PILOT";
}

function isFunctionalStripePortalLink(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    return parsed.hostname === "billing.stripe.com" || parsed.hostname.endsWith(".stripe.com");
  } catch {
    return false;
  }
}

export default async function AccountPage() {
  const sessionUser = await getSessionUserSafely("account-page");
  const planBadge = resolvePlanBadge(sessionUser);
  const email = sessionUser?.email?.trim() || "Unknown";
  const portalUrl =
    process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL?.trim() ||
    process.env.STRIPE_BILLING_PORTAL_URL?.trim() ||
    "";
  const hasFunctionalPortal = isFunctionalStripePortalLink(portalUrl);

  return (
    <section className="space-y-6">
      <div className="space-y-5 border border-ds-text-secondary/30 bg-ds-surface p-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Account</p>
          <h1 className="text-3xl font-medium leading-compact">Profile and plan</h1>
        </header>

        <div className="space-y-2">
          <label htmlFor="account-email" className="block text-xs uppercase tracking-[0.12em] text-ds-text-secondary">
            Email
          </label>
          <input
            id="account-email"
            readOnly
            value={email}
            className="h-11 w-full border border-ds-text-secondary/30 bg-ds-bg px-3 text-sm text-ds-text-primary"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-ds-text-secondary">Current plan</p>
          <span className="inline-flex h-8 items-center border border-ds-gold/60 px-3 text-xs uppercase tracking-[0.14em] text-ds-gold">
            {planBadge}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasFunctionalPortal ? (
            <a href={portalUrl} className="inline-flex min-h-11 items-center bg-ds-gold px-4 py-2 text-sm font-medium text-ds-bg">
              Manage billing →
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center border border-ds-text-secondary/30 px-4 py-2 text-sm text-ds-text-secondary">
              Manage billing unavailable
            </span>
          )}
          <a
            href="/api/auth/signout"
            className="inline-flex min-h-11 items-center border border-ds-text-secondary/30 px-4 py-2 text-sm text-ds-text-primary"
          >
            Sign out
          </a>
        </div>
      </div>

      <div className="space-y-3 border border-ds-text-secondary/30 bg-ds-surface p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Profile</p>
        <div className="min-h-28 border border-ds-text-secondary/30 bg-ds-bg/40 p-4 text-sm text-ds-text-secondary">
          Profile placeholder (Block 8).
        </div>
      </div>
    </section>
  );
}
