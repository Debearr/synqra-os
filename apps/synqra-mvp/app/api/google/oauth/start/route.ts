export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { REDIRECT_PATHS, buildAbsoluteRedirectUrl, getGoogleAuthRedirectPath, resolveSafeNextPath } from "@/lib/redirects";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const nextPath = resolveSafeNextPath(searchParams.get("next"));
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[google/oauth/start] Supabase client configuration error:", error);
    return NextResponse.redirect(buildAbsoluteRedirectUrl(origin, getGoogleAuthRedirectPath("config_error")));
  }

  // Must be allowed in Supabase Auth redirect URLs:
  // - ${origin}/api/google/oauth/callback
  // - ${origin}/enter
  // - ${origin}/studio
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildAbsoluteRedirectUrl(
        origin,
        nextPath
          ? `${REDIRECT_PATHS.GOOGLE_OAUTH_CALLBACK}?next=${encodeURIComponent(nextPath)}`
          : REDIRECT_PATHS.GOOGLE_OAUTH_CALLBACK
      ),
      scopes: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    console.error("[google/oauth/start] OAuth URL generation failed:", error);
    return NextResponse.redirect(buildAbsoluteRedirectUrl(origin, getGoogleAuthRedirectPath("error")));
  }

  return NextResponse.redirect(data.url);
}
