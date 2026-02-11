import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
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

  const protectedRoutes = ["/studio", "/admin", "/agents", "/exec-summary"];
  const isProtectedRoute = protectedRoutes.some(
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
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  if (
    isProduction &&
    isProtectedRoute &&
    !(isExecSummaryRoute && isInvestorDomain)
  ) {
    if (!adminToken) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (!hasValidToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
