import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type EnvCandidate = { name: string; value: string };

function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined);
  if (!value) {
    throw new Error(`Missing Supabase environment variable: ${name}${fallback ? ` or ${fallback}` : ""}`);
  }
  return value;
}

function getConfiguredCandidates(...names: string[]): EnvCandidate[] {
  return names
    .map((name) => ({ name, value: process.env[name]?.trim() ?? "" }))
    .filter((entry) => entry.value.length > 0);
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

function extractProjectRefFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const ref = parsed.hostname.split(".")[0]?.trim();
    return ref && /^[a-z0-9]{20}$/.test(ref) ? ref : null;
  } catch {
    return null;
  }
}

function resolveSupabaseUrl(): string {
  const candidates = getConfiguredCandidates("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  if (candidates.length === 0) {
    throw new Error("Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }

  const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");
  const expectedRef = extractProjectRefFromJwt(anonKey);
  if (!expectedRef) {
    return candidates[0].value;
  }

  const matching = candidates.find((entry) => extractProjectRefFromUrl(entry.value) === expectedRef);
  if (matching) {
    if (matching.name !== candidates[0].name) {
      console.warn(
        `[supabase/server] ${candidates[0].name} ref mismatch detected. Falling back to ${matching.name} for OAuth.`
      );
    }
    return matching.value;
  }

  throw new Error(
    `[supabase/server] Supabase URL ref mismatch. Expected project ref ${expectedRef} from anon key, got ${candidates
      .map((entry) => `${entry.name}=${entry.value}`)
      .join(", ")}`
  );
}

export async function createClient() {
  const cookieStore = await cookies();
  // Vercel must provide these public vars at build/runtime.
  // Server-only aliases are kept for local scripts and legacy environments.
  const supabaseUrl = resolveSupabaseUrl();
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a context where cookies are read-only.
        }
      },
    },
  });
}
