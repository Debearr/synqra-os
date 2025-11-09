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
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'w_member_social r_liteprofile', // Permissions needed to post
    state: crypto.randomUUID(), // CSRF protection
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
