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

export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const user = await getSessionUserSafely("auth-layout");
  const planBadge = resolvePlanBadge(user);

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
