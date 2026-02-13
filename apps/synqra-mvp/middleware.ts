import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr/dist/module/createServerClient";

type AccessRole = "public" | "user" | "admin" | "founder";
type AuthenticatedUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

const PREVIEW_BLOCKED_PREFIXES = ["/q-preview", "/statusq-preview"];
const AUTH_CALLBACK_PREFIXES = ["/auth/callback", "/auth/error"];
const AUTH_ENTRY_PREFIXES = ["/enter", "/auth"];
const USER_PROTECTED_PREFIXES = ["/user", "/dashboard", "/journey", "/studio"];
const ADMIN_PROTECTED_PREFIXES = ["/admin", "/agents", "/exec-summary"];
const FOUNDER_ONLY_PREFIXES = ["/ops"];

const FOUNDER_ROLE_TOKENS = new Set(["founder", "owner", "debear_ops", "ops"]);
const ADMIN_ROLE_TOKENS = new Set(["admin"]);
const INVESTOR_DOMAINS = ["invest.synqra.co", "summary.synqra.co", "synqra.app"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function matchesAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

function normalizeRoleToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function resolveFounderEmails(): Set<string> {
  const sources = [process.env.DEBEAR_OPS_EMAIL, process.env.OWNER_EMAIL, process.env.ADMIN_EMAIL];
  const emails = sources
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  return new Set(emails);
}

function resolveMetadataRole(user: AuthenticatedUser): string | null {
  return normalizeRoleToken(user.app_metadata?.role) ?? normalizeRoleToken(user.user_metadata?.role);
}

function resolveAccessRole(user: AuthenticatedUser | null): AccessRole {
  if (!user) return "public";

  const founderEmails = resolveFounderEmails();
  const email = user.email?.trim().toLowerCase() ?? "";
  if (email && founderEmails.has(email)) {
    return "founder";
  }

  const roleToken = resolveMetadataRole(user);
  if (roleToken && FOUNDER_ROLE_TOKENS.has(roleToken)) {
    return "founder";
  }
  if (roleToken && ADMIN_ROLE_TOKENS.has(roleToken)) {
    return "admin";
  }

  return "user";
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.searchParams.delete("next");
  return NextResponse.redirect(url);
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/sign-in";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function redirectHomeByRole(request: NextRequest, role: AccessRole): NextResponse {
  if (role === "founder") return redirectTo(request, "/ops");
  if (role === "admin") return redirectTo(request, "/admin");
  if (role === "user") return redirectTo(request, "/user");
  return redirectToSignIn(request);
}

async function resolveSessionUser(
  request: NextRequest
): Promise<{ response: NextResponse; user: AuthenticatedUser | null }> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, user: null };
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

  if (!user) {
    return { response, user: null };
  }

  return {
    response,
    user: {
      email: user.email ?? null,
      app_metadata: user.app_metadata as Record<string, unknown>,
      user_metadata: user.user_metadata as Record<string, unknown>,
    },
  };
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  const isInvestorDomain = INVESTOR_DOMAINS.some((domain) => hostname.includes(domain));
  if (isInvestorDomain && pathname === "/") {
    return NextResponse.rewrite(new URL("/exec-summary", request.url));
  }

  if (process.env.NODE_ENV === "production" && matchesAny(pathname, PREVIEW_BLOCKED_PREFIXES)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (matchesAny(pathname, AUTH_CALLBACK_PREFIXES)) {
    return NextResponse.next();
  }

  const isAuthEntryRoute = matchesAny(pathname, AUTH_ENTRY_PREFIXES);
  const isUserProtectedRoute = matchesAny(pathname, USER_PROTECTED_PREFIXES);
  const isAdminProtectedRoute = matchesAny(pathname, ADMIN_PROTECTED_PREFIXES);
  const isFounderOnlyRoute = matchesAny(pathname, FOUNDER_ONLY_PREFIXES);
  const needsAuthEvaluation = isAuthEntryRoute || isUserProtectedRoute || isAdminProtectedRoute || isFounderOnlyRoute;

  if (!needsAuthEvaluation) {
    return NextResponse.next();
  }

  const { response, user } = await resolveSessionUser(request);
  const role = resolveAccessRole(user);

  if (isAuthEntryRoute) {
    if (role === "public") {
      return response;
    }
    return redirectHomeByRole(request, role);
  }

  if (role === "public") {
    return redirectToSignIn(request);
  }

  if (isFounderOnlyRoute) {
    return role === "founder" ? response : redirectHomeByRole(request, role);
  }

  if (isAdminProtectedRoute) {
    if (role === "admin" || role === "founder") {
      return response;
    }
    return redirectHomeByRole(request, role);
  }

  if (isUserProtectedRoute) {
    if (role === "admin") {
      return redirectHomeByRole(request, role);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/enter/:path*",
    "/auth/:path*",
    "/user/:path*",
    "/dashboard/:path*",
    "/journey/:path*",
    "/studio/:path*",
    "/admin/:path*",
    "/agents/:path*",
    "/exec-summary/:path*",
    "/ops/:path*",
    "/q-preview/:path*",
    "/statusq-preview/:path*",
  ],
};
