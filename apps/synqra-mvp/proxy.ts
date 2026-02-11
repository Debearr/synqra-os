import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";
  const adminToken = process.env.ADMIN_TOKEN || "";
  const authCookieName = "synqra_admin_token";

  // Route canonicalization.
  const lowerPath = pathname.toLowerCase();
  if (lowerPath === "/synqra") {
    return NextResponse.redirect(new URL("/studio", request.url));
  }
  if (lowerPath === "/studio" && pathname !== "/studio") {
    return NextResponse.redirect(new URL("/studio", request.url));
  }

  // Investor domains route to exec summary at root.
  const investorDomains = ["invest.synqra.co", "summary.synqra.co", "synqra.app"];
  const isInvestorDomain = investorDomains.some((domain) => hostname.includes(domain));
  if (isInvestorDomain && pathname === "/") {
    return NextResponse.rewrite(new URL("/exec-summary", request.url));
  }

  // Product air-gap enforcement.
  if (pathname.startsWith("/studio/aurafx") || pathname.startsWith("/studio/signals-hub")) {
    return NextResponse.redirect(new URL("/studio", request.url));
  }

  // Preview routes are blocked in production.
  const previewRoutes = ["/q-preview", "/statusq-preview", "/luxgrid"];
  if (isProduction && previewRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Protected route checks for production.
  const protectedRoutes = ["/studio", "/admin", "/agents", "/exec-summary"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isExecSummaryRoute = pathname === "/exec-summary" || pathname.startsWith("/exec-summary/");
  const authTokenFromQuery = request.nextUrl.searchParams.get("adminToken");
  const authTokenFromHeader = request.headers.get("x-admin-token");
  const authTokenFromCookie = request.cookies.get(authCookieName)?.value;
  const hasValidToken =
    adminToken &&
    [authTokenFromQuery, authTokenFromHeader, authTokenFromCookie].some((token) => token && token === adminToken);

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

  if (isProduction && isProtectedRoute && !(isExecSummaryRoute && isInvestorDomain)) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
