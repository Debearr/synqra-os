import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRedirectForRole } from "@/lib/redirects";

type RoleState = "visitor" | "applicant" | "approved_pilot" | "subscriber" | "lapsed";
type SessionUser = {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

const VALID_ROLES: ReadonlySet<RoleState> = new Set(["visitor", "applicant", "approved_pilot", "subscriber", "lapsed"]);
const PUBLIC_EXACT_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/apply",
  "/apply/status",
  "/pricing",
  "/state/lapsed",
  "/state/denied",
  "/state/pending",
  "/state/error",
  "/enter",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/error",
  "/terms",
  "/privacy",
  "/api/google/oauth/start",
  "/api/google/oauth/callback",
  "/api/webhooks/stripe",
]);

const PROTECTED_PREFIXES = ["/dashboard", "/studio", "/calendar", "/account", "/user", "/journey", "/admin", "/ops", "/exec-summary", "/api/council"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function resolveRoleToken(user: SessionUser | null): RoleState {
  if (!user) return "visitor";
  const token = user.app_metadata?.role ?? user.user_metadata?.role;
  if (typeof token !== "string") return "visitor";
  const normalized = token.trim().toLowerCase() as RoleState;
  return VALID_ROLES.has(normalized) ? normalized : "visitor";
}

async function resolveSessionRole(
  request: NextRequest
): Promise<{ response: NextResponse; role: RoleState }> {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const accessToken = readAccessToken(request);
  if (!accessToken) {
    return Promise.resolve({ response, role: "visitor" });
  }

  const config = resolveSupabasePublicConfig();
  if (!config) {
    return Promise.resolve({ response, role: "visitor" });
  }

  try {
    const supabase = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return Promise.resolve({ response, role: "visitor" });
    }

    return Promise.resolve({ response, role: resolveRoleToken(user as SessionUser) });
  } catch {
    return Promise.resolve({ response, role: "visitor" });
  }
}

function redirectToRoleRoute(request: NextRequest, role: RoleState): NextResponse {
  const destination = getRedirectForRole(role);
  if (request.nextUrl.pathname === destination) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.search = "";
  return NextResponse.redirect(url);
}

function readAccessTokenFromAuthorizationHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  const trimmed = token?.trim();
  return trimmed ? trimmed : null;
}

function readSupabaseAccessTokenFromCookies(request: NextRequest): string | null {
  const supabaseCookie = request.cookies
    .getAll()
    .find(({ name }) => name.startsWith("sb-") && name.endsWith("-auth-token"));

  if (!supabaseCookie?.value) {
    return null;
  }

  const decodedValue = decodeURIComponent(supabaseCookie.value);
  if (!decodedValue) return null;

  if (decodedValue.includes(".") && !decodedValue.startsWith("{") && !decodedValue.startsWith("[")) {
    return decodedValue;
  }

  try {
    const parsed = JSON.parse(decodedValue) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === "string" && parsed[0].includes(".")) {
      return parsed[0];
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const token = (parsed as Record<string, unknown>).access_token;
      if (typeof token === "string" && token.includes(".")) {
        return token;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isConfigured(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !/^your[_-]/i.test(trimmed) && !/_here$/i.test(trimmed);
}

function resolveSupabasePublicConfig(): { url: string; anonKey: string } | null {
  const urlCandidate = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKeyCandidate = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!isConfigured(urlCandidate) || !isConfigured(anonKeyCandidate)) {
    return null;
  }
  return {
    url: urlCandidate.trim(),
    anonKey: anonKeyCandidate.trim(),
  };
}

function readAccessToken(request: NextRequest): string | null {
  return readAccessTokenFromAuthorizationHeader(request) ?? readSupabaseAccessTokenFromCookies(request);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const { response, role } = await resolveSessionRole(request);
  const allowed = role === "visitor" || role === "approved_pilot" || role === "subscriber";

  if (allowed) {
    return response;
  }

  return redirectToRoleRoute(request, role);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
