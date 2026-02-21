import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

type CanonicalRole = "visitor" | "applicant" | "approved_pilot" | "subscriber" | "lapsed" | "denied";

type UserRoleUpdateInput = {
  userId: string;
  role: CanonicalRole;
  subscriptionTier?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  pilotApprovedAt?: string | null;
  pilotExpiresAt?: string | null;
  pilotScore?: number | null;
  pilotSummary?: string | null;
};

type SupabaseErrorLike = {
  message?: string;
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function isMissingColumn(error: SupabaseErrorLike | null, column: string): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes(`column "${column.toLowerCase()}"`) && message.includes("does not exist");
}

function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      next[key] = value;
    }
  }
  return next;
}

async function updateUsersById(userId: string, payload: Record<string, unknown>): Promise<boolean> {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.from("users").update(payload).eq("id", userId).select("id").maybeSingle();
  if (error) {
    if (isMissingColumn(error, "id")) return false;
    throw new Error(`users(id) update failed: ${error.message}`);
  }
  if (data) return true;

  const { error: insertError } = await admin.from("users").insert({
    id: userId,
    ...payload,
  });

  if (!insertError) return true;
  if (isMissingColumn(insertError, "id")) return false;
  throw new Error(`users(id) insert failed: ${insertError.message}`);
}

async function updateUsersByUserId(userId: string, payload: Record<string, unknown>): Promise<boolean> {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin
    .from("users")
    .update(payload)
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();
  if (error) {
    if (isMissingColumn(error, "user_id")) return false;
    throw new Error(`users(user_id) update failed: ${error.message}`);
  }
  if (data) return true;

  const { error: insertError } = await admin.from("users").insert({
    user_id: userId,
    ...payload,
  });
  if (!insertError) return true;
  if (isMissingColumn(insertError, "user_id")) return false;
  throw new Error(`users(user_id) insert failed: ${insertError.message}`);
}

async function syncAuthAppMetadata(userId: string, role: CanonicalRole, subscriptionTier?: string): Promise<void> {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error(`auth user lookup failed: ${error?.message ?? "user not found"}`);
  }

  const currentAppMetadata = asObject(data.user.app_metadata);
  const nextAppMetadata = compactObject({
    ...currentAppMetadata,
    role,
    subscription_tier: subscriptionTier ?? currentAppMetadata.subscription_tier,
  });

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: nextAppMetadata,
  });
  if (updateError) {
    throw new Error(`auth metadata update failed: ${updateError.message}`);
  }
}

export async function updateUserRoleState(input: UserRoleUpdateInput): Promise<void> {
  const userId = input.userId.trim();
  if (!userId) {
    throw new Error("userId is required");
  }

  const payload = compactObject({
    role: input.role,
    subscription_tier: input.subscriptionTier,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscriptionId,
    pilot_approved_at: input.pilotApprovedAt,
    pilot_expires_at: input.pilotExpiresAt,
    pilot_score: input.pilotScore,
    pilot_summary: input.pilotSummary,
  });

  const wroteById = await updateUsersById(userId, payload);
  if (!wroteById) {
    const wroteByUserId = await updateUsersByUserId(userId, payload);
    if (!wroteByUserId) {
      throw new Error("public.users is missing both id and user_id columns");
    }
  }

  await syncAuthAppMetadata(userId, input.role, input.subscriptionTier);
}

export async function getUserRoleState(userId: string): Promise<string> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return "visitor";
  }

  const admin = requireSupabaseAdmin();

  const idLookup = await admin.from("users").select("role").eq("id", trimmedUserId).maybeSingle();
  if (!idLookup.error && typeof idLookup.data?.role === "string" && idLookup.data.role.trim()) {
    return idLookup.data.role.trim();
  }

  const shouldFallbackToUserId = !idLookup.error || isMissingColumn(idLookup.error, "id");
  if (shouldFallbackToUserId) {
    const userIdLookup = await admin.from("users").select("role").eq("user_id", trimmedUserId).maybeSingle();
    if (!userIdLookup.error && typeof userIdLookup.data?.role === "string" && userIdLookup.data.role.trim()) {
      return userIdLookup.data.role.trim();
    }
  }

  const authLookup = await admin.auth.admin.getUserById(trimmedUserId);
  if (!authLookup.error && authLookup.data.user) {
    const appRole = asObject(authLookup.data.user.app_metadata).role;
    if (typeof appRole === "string" && appRole.trim()) return appRole.trim();

    const userRole = asObject(authLookup.data.user.user_metadata).role;
    if (typeof userRole === "string" && userRole.trim()) return userRole.trim();
  }

  return "visitor";
}

