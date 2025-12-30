import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Preview / internal routes must not be exposed in production.
  if (
    process.env.NODE_ENV === "production" &&
    (pathname.startsWith("/q-preview") ||
      pathname.startsWith("/statusq-preview") ||
      pathname.startsWith("/luxgrid"))
  ) {
    return new Response("Not Found", { status: 404 });
  }

  // Route-level protection (server-side): require an auth token cookie for admin/studio.
  // Detailed user checks are handled client-side in the studio page.
  if (pathname.startsWith("/admin") || pathname.startsWith("/studio")) {
    const cookies = request.cookies.getAll();
    const authTokenCookie =
      cookies.find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))?.value || null;

    let hasAuth = false;
    if (authTokenCookie) {
      try {
        const parsed = JSON.parse(authTokenCookie);
        hasAuth = Boolean(parsed?.access_token);
      } catch {
        hasAuth = Boolean(authTokenCookie);
      }
    }

    if (!hasAuth) {
      return NextResponse.redirect(new URL("/", request.url));
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

