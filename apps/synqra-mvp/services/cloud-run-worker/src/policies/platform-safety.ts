import { getSupabaseClient } from "../adapters/supabase.js";

const RATE_PROFILES: Record<string, number> = {
  twitter: 100,
  x: 100,
  linkedin: 20,
};

type PublishValidation = { ok: true } | { ok: false; reason: string };

export function validatePublishRequest(platform: string, content: string): PublishValidation {
  if (!platform || !content?.trim()) {
    return { ok: false, reason: "Missing platform or content payload" };
  }

  if ((process.env.SCHEDULING_ENABLED || "false").toLowerCase() !== "true") {
    return { ok: false, reason: "Scheduling is disabled by policy" };
  }

  if ((process.env.AUTO_PUBLISH_ENABLED || "false").toLowerCase() !== "true") {
    return { ok: false, reason: "Auto-publish is disabled by policy" };
  }

  if ((process.env.PLATFORM_CONNECTORS_ENABLED || "false").toLowerCase() !== "true") {
    return { ok: false, reason: "Platform connectors are disabled" };
  }

  return { ok: true };
}

export async function checkPlatformBanRisk(userId: string, platform: string): Promise<PublishValidation> {
  const normalized = platform.trim().toLowerCase();
  const maxPerDay = RATE_PROFILES[normalized] ?? 20;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("outcome_events")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("event_type", "published")
    .gte("created_at", since);

  if (error) {
    return { ok: false, reason: `Ban-risk check failed: ${error.message}` };
  }

  if ((count ?? 0) >= maxPerDay) {
    return { ok: false, reason: `Rate profile exceeded (${count}/${maxPerDay} in 24h)` };
  }

  return { ok: true };
}

