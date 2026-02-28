import type { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import Nav from "@/components/Nav";
import SystemFooter from "@/components/SystemFooter";

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

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

export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const planBadge = resolvePlanBadge((user as SessionUserLike | null) ?? null);

  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="border-b border-ds-text-secondary/20">
        <div className="mx-auto flex h-16 w-full max-w-journey items-center px-4 md:px-6">
          <Nav planBadge={planBadge} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-journey px-4 py-8 md:px-6 md:py-10">{children}</div>
      <SystemFooter />
    </main>
  );
}
