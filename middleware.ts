import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [/^\/dashboard(\/.*)?$/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((re) => re.test(pathname));

  if (!isProtected) return NextResponse.next();

  // Check for Supabase auth cookie (set by SSR helpers)
  const access = req.cookies.get('sb-access-token')?.value;

  if (!access) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
