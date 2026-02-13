import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr/dist/module/createServerClient";

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => {
    if (!cookie.name.startsWith("sb-")) return false;
    if (!cookie.name.includes("-auth-token")) return false;
    return cookie.value.trim().length > 0;
  });
}

function hasGateAccessCookie(request: NextRequest): boolean {
  return request.cookies.get("synqra_gate")?.value === "1";
}

async function refreshSupabaseSession(
  request: NextRequest
): Promise<{ response: NextResponse; hasSession: boolean }> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, hasSession: false };
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

  return { response, hasSession: Boolean(user) };
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";
  const adminToken = process.env.ADMIN_TOKEN || "";
  const authCookieName = "synqra_admin_token";

  // Define the specialized domains
  const investorDomains = [
    "invest.synqra.co",
    "summary.synqra.co",
    "synqra.app" // assuming synqra.app might want this behavior too, or handle differently
  ];

  // Check if current hostname is one of the investor domains
  const isInvestorDomain = investorDomains.some(domain => hostname.includes(domain));

  // If on an investor domain and at root, rewrite to /exec-summary
  if (isInvestorDomain && pathname === "/") {
    return NextResponse.rewrite(new URL("/exec-summary", request.url));
  }

  // Special case for synqra.co/exec-summary (default behavior works, no rewrite needed)

  const previewRoutes = ["/q-preview", "/statusq-preview"];
  const isPreviewRoute = previewRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProduction && isPreviewRoute) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const legacyPublicRoutes = ["/demo", "/login"];
  const isLegacyPublicRoute = legacyPublicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProduction && isLegacyPublicRoute) {
    const enterUrl = request.nextUrl.clone();
    enterUrl.pathname = "/enter";
    return NextResponse.redirect(enterUrl);
  }

  const supabaseProtectedRoutes = ["/studio"];
  const isSupabaseProtectedRoute = supabaseProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const hasGateAccess = hasGateAccessCookie(request);
  let hasSupabaseSession = hasSupabaseSessionCookie(request);
  let sessionResponse: NextResponse | null = null;

  if (isProduction && isSupabaseProtectedRoute && !hasGateAccess) {
    const refreshedSession = await refreshSupabaseSession(request);
    sessionResponse = refreshedSession.response;
    hasSupabaseSession = refreshedSession.hasSession;
  }

  if (
    isProduction &&
    isSupabaseProtectedRoute &&
    pathname !== "/enter" &&
    !hasGateAccess &&
    !hasSupabaseSession
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/enter";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const adminProtectedRoutes = ["/admin", "/agents", "/exec-summary"];
  const isAdminProtectedRoute = adminProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isExecSummaryRoute =
    pathname === "/exec-summary" || pathname.startsWith("/exec-summary/");
  const authTokenFromQuery = request.nextUrl.searchParams.get("adminToken");
  const authTokenFromHeader = request.headers.get("x-admin-token");
  const authTokenFromCookie = request.cookies.get(authCookieName)?.value;
  const hasValidToken =
    adminToken &&
    [authTokenFromQuery, authTokenFromHeader, authTokenFromCookie].some(
      (token) => token && token === adminToken
    );

  if (authTokenFromQuery && adminToken && authTokenFromQuery === adminToken) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("adminToken");
    const response = NextResponse.redirect(url);
    response.cookies.set(authCookieName, adminToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });
    return response;
  }

  if (
    isProduction &&
    isAdminProtectedRoute &&
    !(isExecSummaryRoute && isInvestorDomain)
  ) {
    if (!adminToken) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (!hasValidToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }
  
  if (sessionResponse) {
    return sessionResponse;
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/studio/:path*",
    "/demo/:path*",
    "/login/:path*",
    "/admin/:path*",
    "/agents/:path*",
    "/exec-summary/:path*",
    "/q-preview/:path*",
    "/statusq-preview/:path*",
  ],
};
