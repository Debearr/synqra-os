import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { SignatureStyle } from "./generate/_compliance";

export type AuthenticatedUserIdentity = {
  id: string;
  email: string | null;
};

export type RealtorProfile = {
  signatureStyle: SignatureStyle | null;
  logoPath: string | null;
  onboardingCompleted: boolean;
  updatedAt: string | null;
};

const METADATA_KEY = "realtor_mvp";

function readMetadataEntry(metadata: unknown): Record<string, unknown> {
  const raw = typeof metadata === "object" && metadata !== null ? (metadata as Record<string, unknown>)[METADATA_KEY] : null;
  return typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
}

function readProfileFromMetadata(metadata: unknown): RealtorProfile {
  const entry = readMetadataEntry(metadata);

  const signatureStyle =
    typeof entry.signature_style === "string" ? (entry.signature_style as SignatureStyle) : null;
  const logoPath = typeof entry.logo_path === "string" ? entry.logo_path : null;
  const onboardingCompleted = Boolean(entry.onboarding_completed);
  const updatedAt = typeof entry.updated_at === "string" ? entry.updated_at : null;

  return {
    signatureStyle,
    logoPath,
    onboardingCompleted,
    updatedAt,
  };
}

function getBearerToken(request?: Request): string | null {
  if (!request) {
    return null;
  }

  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim() || null;
}

export async function getAuthenticatedUserIdentity(request?: Request): Promise<AuthenticatedUserIdentity | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    return { id: user.id, email: user.email ?? null };
  }

  const bearer = getBearerToken(request);
  if (!bearer) {
    return null;
  }

  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(bearer);
  if (error || !data.user) {
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? null };
}

export async function getAuthenticatedUserId(request?: Request): Promise<string | null> {
  const identity = await getAuthenticatedUserIdentity(request);
  return identity?.id ?? null;
}

export async function getRealtorProfile(userId: string): Promise<RealtorProfile> {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error("Unable to fetch account profile.");
  }
  return readProfileFromMetadata(data.user.user_metadata);
}

export async function updateRealtorProfile(
  userId: string,
  profile: { signatureStyle: SignatureStyle; logoPath: string | null; onboardingCompleted?: boolean }
): Promise<RealtorProfile> {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error("Unable to load account for update.");
  }

  const existingMetadata =
    typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
      ? (data.user.user_metadata as Record<string, unknown>)
      : {};

  const nextEntry = {
    ...readMetadataEntry(existingMetadata),
    signature_style: profile.signatureStyle,
    logo_path: profile.logoPath,
    onboarding_completed: profile.onboardingCompleted ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existingMetadata,
      [METADATA_KEY]: nextEntry,
    },
  });

  if (updateError || !updated.user) {
    throw new Error("Unable to save onboarding settings.");
  }

  return readProfileFromMetadata(updated.user.user_metadata);
}

export async function markRealtorGenerationSuccess(userId: string, assetCount: number, generatedAtIso?: string): Promise<void> {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error("Unable to load account for generation marker.");
  }

  const existingMetadata =
    typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
      ? (data.user.user_metadata as Record<string, unknown>)
      : {};
  const existingEntry = readMetadataEntry(existingMetadata);
  const currentSuccessCount =
    typeof existingEntry.generation_success_count === "number" && Number.isFinite(existingEntry.generation_success_count)
      ? existingEntry.generation_success_count
      : 0;

  const nextEntry = {
    ...existingEntry,
    last_generation_success_at: generatedAtIso ?? new Date().toISOString(),
    last_generation_asset_count: assetCount,
    generation_success_count: currentSuccessCount + 1,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existingMetadata,
      [METADATA_KEY]: nextEntry,
    },
  });

  if (updateError) {
    throw new Error(`Unable to persist generation success marker: ${updateError.message}`);
  }
}
