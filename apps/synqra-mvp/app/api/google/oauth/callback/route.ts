import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { storeRawRefreshToken } from "@/lib/integrations/google/token-store";
import { buildAbsoluteRedirectUrl, getGoogleAuthRedirectPath, resolveSafeNextPath } from "@/lib/redirects";
import { normalizeAuthEmail, resolvePostLoginState } from "@/lib/auth/post-login";

type ExchangeSession = {
  id?: string | null;
  user?: { id?: string | null } | null;
  provider_refresh_token?: string | null;
  email?: string | null;
};

function resolveUserId(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const typed = input as ExchangeSession;
  if (typeof typed.id === "string" && typed.id.trim()) return typed.id;
  const nested = typed.user?.id;
  return typeof nested === "string" && nested.trim() ? nested : null;
}

function resolveProviderRefreshToken(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const token = (input as ExchangeSession).provider_refresh_token;
  return typeof token === "string" && token.trim() ? token : null;
}

function resolveUserEmail(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const typed = input as ExchangeSession;
  return normalizeAuthEmail(typed.email) ?? normalizeAuthEmail(typed.user && "email" in typed.user ? (typed.user as { email?: unknown }).email : null);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const nextPath = resolveSafeNextPath(searchParams.get("next"));

  if (error) {
    return NextResponse.redirect(buildAbsoluteRedirectUrl(origin, getGoogleAuthRedirectPath("error")));
  }

  if (code) {
    let supabase: Awaited<ReturnType<typeof createClient>>;
    try {
      supabase = await createClient();
    } catch (clientError) {
      console.error("[google/oauth/callback] Supabase client configuration error:", clientError);
      return NextResponse.redirect(buildAbsoluteRedirectUrl(origin, getGoogleAuthRedirectPath("config_error")));
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const userId = resolveUserId(data?.session) || resolveUserId(data?.user);
      const providerRefreshToken = resolveProviderRefreshToken(data?.session);
      const userEmail = resolveUserEmail(data?.user) || resolveUserEmail(data?.session);
      if (userId && providerRefreshToken) {
        try {
          await storeRawRefreshToken(userId, providerRefreshToken);
        } catch (tokenStoreError) {
          console.warn("Failed to persist Google refresh token after OAuth callback:", tokenStoreError);
        }
      }

      const { redirectTo } = await resolvePostLoginState({
        userId,
        email: userEmail,
        nextPath,
      });
      return NextResponse.redirect(buildAbsoluteRedirectUrl(origin, redirectTo));
    }

    console.error("[google/oauth/callback] Session exchange failed:", error);
  }

  return NextResponse.redirect(buildAbsoluteRedirectUrl(origin, getGoogleAuthRedirectPath("error")));
}
