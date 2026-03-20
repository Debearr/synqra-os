import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type PlanBadge = "PILOT" | "CORE" | "PRO" | "STUDIO";

type SessionUserLike = {
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

export default async function DashboardPage() {
  const user = await getSessionUserSafely("dashboard-page");
  const planBadge = resolvePlanBadge(user);

  return (
    <section className="space-y-6">
      <div className="space-y-6 border border-ds-text-secondary/30 bg-ds-surface p-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Dashboard</p>
          <h1 className="text-3xl font-medium leading-compact">Welcome back.</h1>
          <p className="max-w-2xl text-sm leading-copy text-ds-text-secondary">
            The fastest path from here is one focused brief, one chosen surface, and one draft you can ship today.
          </p>
          <span className="inline-flex h-8 items-center border border-ds-gold/60 px-3 text-xs uppercase tracking-[0.14em] text-ds-gold">
            {planBadge}
          </span>
        </header>

        <div className="flex flex-wrap items-start gap-3">
          <Link
            href="/studio"
            className="inline-flex min-h-11 items-center bg-ds-gold px-4 py-2 text-sm font-medium text-ds-bg"
            data-testid="dashboard-open-studio"
          >
            Open Studio -&gt;
          </Link>
          <span className="inline-flex min-h-11 items-center border border-ds-text-secondary/30 px-4 py-2 text-sm text-ds-text-secondary">
            Best first run: choose realtor or travel advisor, pick one surface, and generate one clean draft
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-4 border border-ds-text-secondary/30 bg-ds-surface p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Today&apos;s Flow</p>
          <ol className="space-y-3 text-sm leading-copy text-ds-text-primary">
            <li>1. Select the client vertical you are writing for.</li>
            <li>2. Write the business outcome you need right now.</li>
            <li>3. Generate, read, and refine from signal instead of guesswork.</li>
          </ol>
        </div>

        <div className="space-y-3 border border-ds-text-secondary/30 bg-ds-surface p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Profile nudge</p>
          <div className="min-h-28 border border-ds-text-secondary/30 bg-ds-bg/40 p-4 text-sm text-ds-text-secondary">
            Profile completion can wait. The product value right now is draft velocity, not setup ceremony.
          </div>
        </div>
      </div>
    </section>
  );
}
