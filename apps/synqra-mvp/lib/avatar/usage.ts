import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvatarUsage } from "./types";

type AvatarUsageRow = {
  plan?: string | null;
  videos_generated?: number | null;
  cost_to_date?: number | string | null;
  window_start?: string | null;
  window_end?: string | null;
  perceptual_hash?: string | null;
};

export function mapUsageRowToAvatarUsage(row: AvatarUsageRow, userId: string): AvatarUsage {
  return {
    userId,
    plan: (row.plan as AvatarUsage["plan"]) ?? "lite",
    videosGenerated: row.videos_generated ?? 0,
    costToDate: Number(row.cost_to_date ?? 0),
    windowStart: row.window_start ?? new Date().toISOString(),
    windowEnd: row.window_end ?? new Date().toISOString(),
    perceptualHash: row.perceptual_hash ?? undefined,
  };
}

export async function fetchAvatarUsage(client: SupabaseClient, userId: string): Promise<AvatarUsage | undefined> {
  const { data } = await client
    .from("avatar_usage")
    .select("plan, videos_generated, cost_to_date, window_start, window_end, perceptual_hash")
    .eq("user_id", userId)
    .single();

  if (!data) return undefined;
  return mapUsageRowToAvatarUsage(data as AvatarUsageRow, userId);
}
