import { NextResponse } from 'next/server';

/**
 * LinkedIn OAuth Flow - Step 1: Redirect to LinkedIn Authorization
 *
 * Usage: Navigate to /api/oauth/linkedin/start
 * This will redirect the user to LinkedIn to authorize the app
 */
const STATE_COOKIE = "synqra_oauth_li_state";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        ok: false,
        error: 'LinkedIn OAuth not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_REDIRECT_URI',
      },
      { status: 500 }
    );
  }

  // LinkedIn OAuth 2.0 authorization endpoint
  const state = crypto.randomUUID(); // CSRF protection (validated in callback)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'w_member_social r_liteprofile', // Permissions needed to post
    state,
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  const res = NextResponse.redirect(authUrl);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });
  return res;
}
