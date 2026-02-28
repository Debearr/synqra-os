import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type PlanBadge = "PILOT" | "CORE" | "PRO" | "STUDIO";

type SessionUserLike = {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const planBadge = resolvePlanBadge((user as SessionUserLike | null) ?? null);

  return (
    <section className="space-y-6">
      <div className="space-y-6 border border-ds-text-secondary/30 bg-ds-surface p-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Dashboard</p>
          <h1 className="text-3xl font-medium leading-compact">Welcome back.</h1>
          <span className="inline-flex h-8 items-center border border-ds-gold/60 px-3 text-xs uppercase tracking-[0.14em] text-ds-gold">
            {planBadge}
          </span>
        </header>
        <div>
          <Link
            href="/studio"
            className="inline-flex min-h-11 items-center bg-ds-gold px-4 py-2 text-sm font-medium text-ds-bg"
          >
            Open Studio →
          </Link>
        </div>
      </div>

      <div className="space-y-3 border border-ds-text-secondary/30 bg-ds-surface p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Profile nudge</p>
        <div className="min-h-28 border border-ds-text-secondary/30 bg-ds-bg/40 p-4 text-sm text-ds-text-secondary">
          Profile completion placeholder (Block 8).
        </div>
      </div>
    </section>
  );
}
