import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

const PROTECTED_PREFIXES = ["/dashboard", "/studio", "/calendar", "/account", "/user", "/journey", "/admin", "/ops", "/exec-summary"];

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
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, role: "visitor" };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, role: resolveRoleToken(user as SessionUser | null) };
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
