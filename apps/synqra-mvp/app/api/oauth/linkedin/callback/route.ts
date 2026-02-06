import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';

const STATE_COOKIE = "synqra_oauth_li_state";

/**
 * LinkedIn OAuth Flow - Step 2: Handle Callback
 *
 * LinkedIn redirects here after user authorizes the app
 * Exchanges authorization code for access token and stores in database
 */
export async function GET(req: NextRequest) {
  const supabase = requireSupabaseAdmin();
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value || null;

  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Unknown error';
    console.error('LinkedIn OAuth error:', error, errorDescription);
    return NextResponse.redirect('/admin/integrations?error=linkedin_denied');
  }

  // Server-side CSRF protection: validate state
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect('/admin/integrations?error=linkedin_state_mismatch');
  }

  if (!code) {
    return NextResponse.json(
      { ok: false, error: 'No authorization code received' },
      { status: 400 }
    );
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: 'LinkedIn OAuth credentials not configured' },
      { status: 500 }
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('LinkedIn token exchange failed:', errorData);
      return NextResponse.redirect('/admin/integrations?error=linkedin_token_failed');
    }

    const tokens = await tokenResponse.json();

    // Get user profile to retrieve account ID
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Failed to fetch LinkedIn profile');
      return NextResponse.redirect('/admin/integrations?error=linkedin_profile_failed');
    }

    const profile = await profileResponse.json();
    const accountId = `urn:li:person:${profile.id}`;

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('social_tokens')
      .upsert({
        platform: 'LinkedIn',
        account_id: accountId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'platform,account_id',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect('/admin/integrations?error=database_failed');
    }

    // Redirect to admin with success message (clear state cookie)
    const res = NextResponse.redirect('/admin/integrations?success=linkedin');
    res.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;

  } catch (error: unknown) {
    console.error('LinkedIn OAuth callback error:', error);
    const res = NextResponse.redirect('/admin/integrations?error=unexpected');
    res.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }
}
