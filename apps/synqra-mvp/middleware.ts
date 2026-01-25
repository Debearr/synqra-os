import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === DEV MODE: DO NOT BLOCK ANYTHING ===
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // === PROD BLOCKLIST ===
  if (
    pathname.startsWith("/q-preview") ||
    pathname.startsWith("/statusq-preview") ||
    pathname.startsWith("/luxgrid")
  ) {
    return new Response("Not Found", { status: 404 });
  }

  // === PROTECTED ROUTES ===
  if (pathname.startsWith("/studio") || pathname.startsWith("/admin")) {
    // Allow identity-code cookie for /studio
    if (pathname.startsWith("/studio")) {
      const synqraAuth = request.cookies.get("synqra_auth")?.value;
      if (synqraAuth) return NextResponse.next();
    }

    // Allow Supabase OAuth cookie
    const authCookie = request.cookies
      .getAll()
      .find(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))
      ?.value;

    if (!authCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
