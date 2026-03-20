import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type CanonicalRole = "visitor" | "applicant" | "approved_pilot" | "subscriber" | "lapsed" | "denied";

type AuthQaEnv = {
  adminEmail: string;
  baseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
};

type ProvisionedUser = {
  email: string;
  password: string;
  userId: string;
};

let cachedAdminClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function firstConfigured(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return null;
}

function isMissingColumn(message: string | undefined, column: string): boolean {
  const normalized = message?.toLowerCase() ?? "";
  return normalized.includes(`column "${column.toLowerCase()}"`) && normalized.includes("does not exist");
}

export function loadAuthQaEnv(): AuthQaEnv {
  return {
    adminEmail: firstConfigured("ADMIN_EMAIL")?.toLowerCase() || requireEnv("ADMIN_EMAIL").toLowerCase(),
    baseUrl: process.env.PLAYWRIGHT_BASE_URL?.trim() || `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT?.trim() || "3201"}`,
    supabaseUrl: firstConfigured("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL") || requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: firstConfigured("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY") || requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey:
      firstConfigured("SUPABASE_SERVICE_ROLE", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY") ||
      requireEnv("SUPABASE_SERVICE_ROLE"),
  };
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!cachedAdminClient) {
    const env = loadAuthQaEnv();
    cachedAdminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedAdminClient;
}

export function uniqueTestEmail(prefix = "auth-qa"): string {
  const entropy = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${entropy}@mailinator.com`;
}

export function uniqueTestPassword(): string {
  return `PwSynqraAuth${Date.now()}aa11!`;
}

async function listAllUsers(): Promise<User[]> {
  const admin = getSupabaseAdmin();
  const users: User[] = [];

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Unable to list Supabase users: ${error.message}`);
    }

    const pageUsers = data.users ?? [];
    users.push(...pageUsers);

    if (pageUsers.length < 200) {
      break;
    }
  }

  return users;
}

export async function findAuthUsersByEmail(email: string): Promise<User[]> {
  const normalized = email.trim().toLowerCase();
  const users = await listAllUsers();
  return users.filter((user) => user.email?.trim().toLowerCase() === normalized);
}

export async function waitForAuthUserByEmail(email: string, timeoutMs = 30000): Promise<User> {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const users = await findAuthUsersByEmail(email);
    if (users[0]) {
      return users[0];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for auth user ${email}`);
}

async function upsertUsersRole(
  userId: string,
  email: string,
  role: CanonicalRole,
  subscriptionTier = "studio"
): Promise<void> {
  const admin = getSupabaseAdmin();
  const payload = {
    email,
    role,
    subscription_tier: subscriptionTier,
  };

  const byId = await admin.from("users").update(payload).eq("id", userId).select("id").maybeSingle();
  if (byId.error && !isMissingColumn(byId.error.message, "id")) {
    throw new Error(`users(id) update failed: ${byId.error.message}`);
  }

  if (byId.data) {
    return;
  }

  const byIdInsert = await admin.from("users").insert({
    id: userId,
    ...payload,
  });
  if (!byIdInsert.error) {
    return;
  }
  if (!isMissingColumn(byIdInsert.error.message, "id")) {
    throw new Error(`users(id) insert failed: ${byIdInsert.error.message}`);
  }

  const byUserId = await admin.from("users").update(payload).eq("user_id", userId).select("user_id").maybeSingle();
  if (byUserId.error && !isMissingColumn(byUserId.error.message, "user_id")) {
    throw new Error(`users(user_id) update failed: ${byUserId.error.message}`);
  }

  if (byUserId.data) {
    return;
  }

  const byUserIdInsert = await admin.from("users").insert({
    user_id: userId,
    ...payload,
  });
  if (byUserIdInsert.error && !isMissingColumn(byUserIdInsert.error.message, "user_id")) {
    throw new Error(`users(user_id) insert failed: ${byUserIdInsert.error.message}`);
  }
}

export async function promoteUserToRole(userId: string, role: CanonicalRole, subscriptionTier = "studio"): Promise<void> {
  const admin = getSupabaseAdmin();
  const lookup = await admin.auth.admin.getUserById(userId);
  if (lookup.error || !lookup.data.user) {
    throw new Error(`Unable to load auth user ${userId}: ${lookup.error?.message ?? "not found"}`);
  }
  const email = lookup.data.user.email?.trim();
  if (!email) {
    throw new Error(`Unable to resolve email for auth user ${userId}`);
  }

  const currentAppMetadata = lookup.data.user.app_metadata ?? {};
  const currentUserMetadata = lookup.data.user.user_metadata ?? {};

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
    app_metadata: {
      ...currentAppMetadata,
      role,
      subscription_tier: subscriptionTier,
    },
    user_metadata: {
      ...currentUserMetadata,
      role,
      subscription_tier: subscriptionTier,
    },
  });
  if (updateError) {
    throw new Error(`Unable to update auth metadata for ${userId}: ${updateError.message}`);
  }

  await upsertUsersRole(userId, email, role, subscriptionTier);
}

export async function confirmAndPromoteUserByEmail(
  email: string,
  role: CanonicalRole = "subscriber",
  subscriptionTier = "studio"
): Promise<User> {
  const user = await waitForAuthUserByEmail(email);
  await promoteUserToRole(user.id, role, subscriptionTier);
  return waitForAuthUserByEmail(email);
}

export async function createSubscriberUser(email = uniqueTestEmail("auth-subscriber"), password = uniqueTestPassword()): Promise<ProvisionedUser> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role: "subscriber",
      subscription_tier: "studio",
    },
    user_metadata: {
      role: "subscriber",
      subscription_tier: "studio",
    },
  });

  if (error || !data.user) {
    throw new Error(`Unable to create auth QA user: ${error?.message ?? "unknown error"}`);
  }

  const createdEmail = data.user.email?.trim();
  if (!createdEmail) {
    throw new Error(`Unable to resolve email for created auth QA user ${data.user.id}`);
  }

  await upsertUsersRole(data.user.id, createdEmail, "subscriber", "studio");

  return {
    email,
    password,
    userId: data.user.id,
  };
}

export async function deleteUserById(userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Unable to delete auth QA user ${userId}: ${error.message}`);
  }
}

export async function deleteUsersByEmail(email: string): Promise<void> {
  const users = await findAuthUsersByEmail(email);
  for (const user of users) {
    await deleteUserById(user.id);
  }
}
