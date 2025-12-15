import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

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

