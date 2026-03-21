import "server-only";

import { getPennyRuntimeConfig } from "./config";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

export type PennyAccessState =
  | "founder"
  | "admin"
  | "invited"
  | "trial"
  | "active"
  | "grace"
  | "expired"
  | "revoked";

export type PennyAccessRow = {
  id: string;
  owner_id: string;
  subject_user_id: string | null;
  telegram_user_id: string | null;
  telegram_chat_id: string | null;
  access_state: PennyAccessState;
  subscription_tier: string;
  source: string;
  created_at: string;
  updated_at: string;
};

/**
 * Penny access helpers using privileged server-side Supabase access.
 * This module is intentionally internal/admin-scoped.
 */

function getPrivilegedPennyAdminClient() {
  return requireSupabaseAdmin();
}

function normalizeNullable(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireOwnerId(ownerId: string): string {
  const trimmed = ownerId.trim();
  if (!trimmed) {
    throw new Error("ownerId is required");
  }
  return trimmed;
}

function requireIdentity(input: { subjectUserId?: string | null; telegramUserId?: string | null }) {
  const subjectUserId = normalizeNullable(input.subjectUserId);
  const telegramUserId = normalizeNullable(input.telegramUserId);

  if (!subjectUserId && !telegramUserId) {
    throw new Error("subjectUserId or telegramUserId is required");
  }

  return { subjectUserId, telegramUserId };
}

export async function createPennyAccessEntry(input: {
  ownerId: string;
  subjectUserId?: string | null;
  telegramUserId?: string | null;
  telegramChatId?: string | null;
  accessState: PennyAccessState;
  subscriptionTier?: string;
  source?: string;
}): Promise<PennyAccessRow> {
  const supabase = getPrivilegedPennyAdminClient();
  const ownerId = requireOwnerId(input.ownerId);
  const { subjectUserId, telegramUserId } = requireIdentity(input);

  const { data, error } = await supabase
    .from("penny_access")
    .insert({
      owner_id: ownerId,
      subject_user_id: subjectUserId,
      telegram_user_id: telegramUserId,
      telegram_chat_id: normalizeNullable(input.telegramChatId),
      access_state: input.accessState,
      subscription_tier: normalizeNullable(input.subscriptionTier) ?? "none",
      source: normalizeNullable(input.source) ?? "manual",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create Penny access entry: ${error.message}`);
  }

  return data as PennyAccessRow;
}

export async function upsertPennyAccessEntry(input: {
  ownerId: string;
  subjectUserId?: string | null;
  telegramUserId?: string | null;
  telegramChatId?: string | null;
  accessState: PennyAccessState;
  subscriptionTier?: string;
  source?: string;
}): Promise<PennyAccessRow> {
  const supabase = getPrivilegedPennyAdminClient();
  const ownerId = requireOwnerId(input.ownerId);
  const { subjectUserId, telegramUserId } = requireIdentity(input);

  const [existingBySubjectUserId, existingByTelegramUserId] = await Promise.all([
    subjectUserId ? getPennyAccessEntryBySubjectUserId(subjectUserId) : Promise.resolve(null),
    telegramUserId ? getPennyAccessEntryByTelegramUserId(telegramUserId) : Promise.resolve(null),
  ]);

  if (
    existingBySubjectUserId &&
    existingByTelegramUserId &&
    existingBySubjectUserId.id !== existingByTelegramUserId.id
  ) {
    throw new Error("Penny access identity collision: subjectUserId and telegramUserId map to different rows");
  }

  const existingRow = existingBySubjectUserId ?? existingByTelegramUserId;
  if (existingRow && existingRow.owner_id !== ownerId) {
    throw new Error("Penny access owner mismatch for existing identity");
  }

  const mutation = {
    owner_id: existingRow?.owner_id ?? ownerId,
    subject_user_id: subjectUserId ?? existingRow?.subject_user_id ?? null,
    telegram_user_id: telegramUserId ?? existingRow?.telegram_user_id ?? null,
    telegram_chat_id: normalizeNullable(input.telegramChatId) ?? existingRow?.telegram_chat_id ?? null,
    access_state: input.accessState,
    subscription_tier: normalizeNullable(input.subscriptionTier) ?? existingRow?.subscription_tier ?? "none",
    source: normalizeNullable(input.source) ?? "manual",
  };

  if (existingRow) {
    const { data, error } = await supabase
      .from("penny_access")
      .update(mutation)
      .eq("id", existingRow.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update Penny access entry: ${error.message}`);
    }

    return data as PennyAccessRow;
  }

  const { data, error } = await supabase
    .from("penny_access")
    .insert(mutation)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert Penny access entry: ${error.message}`);
  }

  return data as PennyAccessRow;
}

export async function listPennyAccessEntries(ownerId: string, options?: { limit?: number }): Promise<PennyAccessRow[]> {
  const supabase = getPrivilegedPennyAdminClient();
  const resolvedOwnerId = requireOwnerId(ownerId);
  const limit = Math.max(1, Math.min(options?.limit ?? 100, 200));

  const { data, error } = await supabase
    .from("penny_access")
    .select("*")
    .eq("owner_id", resolvedOwnerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list Penny access entries: ${error.message}`);
  }

  return (data || []) as PennyAccessRow[];
}

export async function listPennyTelegramAccessEntries(
  ownerId: string,
  options?: { limit?: number }
): Promise<PennyAccessRow[]> {
  const supabase = getPrivilegedPennyAdminClient();
  const resolvedOwnerId = requireOwnerId(ownerId);
  const limit = Math.max(1, Math.min(options?.limit ?? 100, 200));

  const { data, error } = await supabase
    .from("penny_access")
    .select("*")
    .eq("owner_id", resolvedOwnerId)
    .not("telegram_chat_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list Penny Telegram access entries: ${error.message}`);
  }

  return (data || []) as PennyAccessRow[];
}

export async function getPennyAccessEntryBySubjectUserId(subjectUserId: string): Promise<PennyAccessRow | null> {
  const supabase = getPrivilegedPennyAdminClient();
  const resolvedSubjectUserId = normalizeNullable(subjectUserId);
  if (!resolvedSubjectUserId) return null;

  const { data, error } = await supabase
    .from("penny_access")
    .select("*")
    .eq("subject_user_id", resolvedSubjectUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Penny access by subject user: ${error.message}`);
  }

  return (data as PennyAccessRow | null) ?? null;
}

export async function getPennyAccessEntryByTelegramUserId(telegramUserId: string): Promise<PennyAccessRow | null> {
  const supabase = getPrivilegedPennyAdminClient();
  const resolvedTelegramUserId = normalizeNullable(telegramUserId);
  if (!resolvedTelegramUserId) return null;

  const { data, error } = await supabase
    .from("penny_access")
    .select("*")
    .eq("telegram_user_id", resolvedTelegramUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Penny access by Telegram user: ${error.message}`);
  }

  return (data as PennyAccessRow | null) ?? null;
}

export async function ensurePennyFounderAccessEntry(ownerId: string): Promise<PennyAccessRow> {
  const resolvedOwnerId = requireOwnerId(ownerId);
  const config = getPennyRuntimeConfig();

  if (!config.founderUserId) {
    throw new Error("PENNY_FOUNDER_USER_ID is not configured");
  }

  if (config.founderUserId !== resolvedOwnerId) {
    throw new Error("Owner is not the configured Penny founder");
  }

  return upsertPennyAccessEntry({
    ownerId: resolvedOwnerId,
    subjectUserId: resolvedOwnerId,
    telegramUserId: config.founderTelegramUserId,
    accessState: "founder",
    subscriptionTier: "none",
    source: "founder_bootstrap",
  });
}
