import { resolvePostAuthRedirect, resolveSafeNextPath } from "@/lib/redirects";
import { getUserRoleState, updateUserRoleState } from "@/lib/user-role-state";

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function isConfiguredOwnerEmail(email: string | null): boolean {
  const ownerEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  return Boolean(ownerEmail && email && ownerEmail === email);
}

export async function maybeBootstrapOwnerRole(userId: string | null, email: string | null, currentRole: string): Promise<string> {
  if (!userId || !isConfiguredOwnerEmail(email)) {
    return currentRole;
  }

  if (currentRole === "subscriber") {
    return currentRole;
  }

  await updateUserRoleState({
    userId,
    role: "subscriber",
    subscriptionTier: "studio",
  });

  return "subscriber";
}

export async function resolvePostLoginState(input: {
  userId: string | null;
  email: string | null;
  nextPath?: string | null;
}): Promise<{ role: string; redirectTo: string }> {
  const safeNextPath = resolveSafeNextPath(input.nextPath);

  let role = "visitor";
  if (input.userId) {
    try {
      role = await getUserRoleState(input.userId);
      role = await maybeBootstrapOwnerRole(input.userId, input.email, role);
    } catch (roleError) {
      console.warn("[auth/post-login] Failed to resolve role from Supabase users table:", roleError);
    }
  }

  return {
    role,
    redirectTo: resolvePostAuthRedirect(role, safeNextPath),
  };
}

export function normalizeAuthEmail(value: unknown): string | null {
  return normalizeEmail(value);
}
