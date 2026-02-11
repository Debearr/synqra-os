const LEGACY_SERVICE_ROLE_ALIASES = ["SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE"] as const;

const SUPABASE_URL_CANDIDATES = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const SUPABASE_ANON_CANDIDATES = ["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const SUPABASE_SERVICE_ROLE_CANDIDATES = ["SUPABASE_SERVICE_ROLE_KEY", ...LEGACY_SERVICE_ROLE_ALIASES] as const;

const PLACEHOLDER_PATTERNS = [/^your[_-]/i, /_here$/i, /example/i];

function validateUrlProtocol(url: string, source: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`[Supabase Env] ${source} must start with http:// or https://`);
    }
  } catch (error) {
    throw new Error(
      `[Supabase Env] ${source} is invalid: ${error instanceof Error ? error.message : "Unknown URL error"}`
    );
  }
}

function isConfigured(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function resolveEnvVar(candidates: readonly string[], purpose: string): { name: string; value: string } {
  for (const name of candidates) {
    const value = process.env[name];
    if (isConfigured(value)) {
      return { name, value: value.trim() };
    }
  }

  const names = candidates.join(", ");
  throw new Error(`[Supabase Env] ${purpose} is missing or placeholder. Checked: ${names}`);
}

function extractProjectRefFromJwt(token: string): string | null {
  try {
    const segments = token.split(".");
    if (segments.length < 2) return null;
    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8")) as { ref?: unknown };
    return typeof payload.ref === "string" && payload.ref.trim() ? payload.ref.trim() : null;
  } catch {
    return null;
  }
}

function validateProjectRefAlignment(url: string, serviceRoleKey: string) {
  const projectRef = extractProjectRefFromJwt(serviceRoleKey);
  if (!projectRef) return;

  try {
    const hostname = new URL(url).hostname;
    if (!hostname.startsWith(`${projectRef}.`)) {
      throw new Error(
        `[Supabase Env] SUPABASE_URL project ref does not match SUPABASE_SERVICE_ROLE_KEY ref (${projectRef}).`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[Supabase Env]")) {
      throw error;
    }
  }
}

export function getSupabaseUrl(): string {
  const urlCandidates = SUPABASE_URL_CANDIDATES.map((name) => ({ name, value: process.env[name] }))
    .filter((entry) => isConfigured(entry.value))
    .map((entry) => ({ name: entry.name, value: entry.value!.trim() }));

  if (urlCandidates.length === 0) {
    throw new Error(`[Supabase Env] Supabase URL is missing or placeholder. Checked: ${SUPABASE_URL_CANDIDATES.join(", ")}`);
  }

  for (const candidate of urlCandidates) {
    validateUrlProtocol(candidate.value, candidate.name);
  }

  const serviceRoleResolved = resolveEnvVar(SUPABASE_SERVICE_ROLE_CANDIDATES, "Supabase service role key");
  const expectedRef = extractProjectRefFromJwt(serviceRoleResolved.value);
  if (!expectedRef) {
    return urlCandidates[0].value;
  }

  const matchingUrl = urlCandidates.find((candidate) => {
    try {
      return new URL(candidate.value).hostname.startsWith(`${expectedRef}.`);
    } catch {
      return false;
    }
  });

  if (matchingUrl) {
    if (matchingUrl.name !== urlCandidates[0].name) {
      console.warn(
        `[Supabase Env] ${urlCandidates[0].name} does not match service role ref. Falling back to ${matchingUrl.name}.`
      );
    }
    return matchingUrl.value;
  }

  throw new Error(
    `[Supabase Env] URL project ref does not match SUPABASE_SERVICE_ROLE_KEY ref (${expectedRef}).`
  );
}

export function getSupabaseAnonKey(): string {
  return resolveEnvVar(SUPABASE_ANON_CANDIDATES, "Supabase anon key").value;
}

export function getSupabaseServiceRoleKey(): string {
  const resolved = resolveEnvVar(SUPABASE_SERVICE_ROLE_CANDIDATES, "Supabase service role key");
  if (resolved.name !== "SUPABASE_SERVICE_ROLE_KEY") {
    console.warn(`[Supabase Env] Falling back to ${resolved.name}. Set SUPABASE_SERVICE_ROLE_KEY and restart.`);
  }
  return resolved.value;
}

export function assertSupabaseConfigured(): void {
  const url = getSupabaseUrl();
  getSupabaseAnonKey();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  validateProjectRefAlignment(url, serviceRoleKey);
}
