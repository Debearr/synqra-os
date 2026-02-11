import { NextResponse } from 'next/server';

/**
 * LinkedIn OAuth Flow - Step 1: Redirect to LinkedIn Authorization
 *
 * Usage: Navigate to /api/oauth/linkedin/start
 * This will redirect the user to LinkedIn to authorize the app
 */
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
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'w_member_social r_liteprofile', // Permissions needed to post
    state, // CSRF protection
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("synqra_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
