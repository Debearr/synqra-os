const LEGACY_SERVICE_ROLE_ALIASES = [
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_SERVICE_ROLE",
] as const;

function validateUrlProtocol(url: string, source: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(
        `[Supabase Env] ${source} must start with http:// or https://`
      );
    }
  } catch (error) {
    throw new Error(
      `[Supabase Env] ${source} is invalid: ${
        error instanceof Error ? error.message : "Unknown URL error"
      }`
    );
  }
}

function ensurePresent(value: string | undefined, name: string) {
  if (!value || value.trim() === "") {
    throw new Error(`[Supabase Env] ${name} is missing or empty`);
  }
  return value;
}

export function getSupabaseUrl(): string {
  const supabaseUrl = ensurePresent(process.env.SUPABASE_URL, "SUPABASE_URL");
  validateUrlProtocol(supabaseUrl, "SUPABASE_URL");
  return supabaseUrl;
}

export function getSupabaseAnonKey(): string {
  const anonKey = ensurePresent(
    process.env.SUPABASE_ANON_KEY,
    "SUPABASE_ANON_KEY"
  );
  return anonKey;
}

export function getSupabaseServiceRoleKey(): string {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey && serviceRoleKey.trim() !== "") {
    return serviceRoleKey;
  }

  for (const alias of LEGACY_SERVICE_ROLE_ALIASES) {
    const value = process.env[alias];
    if (value && value.trim() !== "") {
      console.warn(
        `[Supabase Env] Falling back to ${alias}. Set SUPABASE_SERVICE_ROLE_KEY and restart.`
      );
      return value;
    }
  }

  throw new Error(
    "[Supabase Env] SUPABASE_SERVICE_ROLE_KEY is missing or empty"
  );
}

export function assertSupabaseConfigured(): void {
  getSupabaseUrl();
  getSupabaseAnonKey();
  getSupabaseServiceRoleKey();
}
