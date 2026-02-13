import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { storeRawRefreshToken } from "@/lib/integrations/google/token-store";

type ExchangeSession = {
  id?: string | null;
  user?: { id?: string | null } | null;
  provider_refresh_token?: string | null;
};

function resolveUserId(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const session = input as ExchangeSession;
  const userId = session.id || session.user?.id;
  return typeof userId === "string" && userId.trim() ? userId : null;
}

function resolveProviderRefreshToken(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const session = input as ExchangeSession;
  return typeof session.provider_refresh_token === "string" && session.provider_refresh_token.trim()
    ? session.provider_refresh_token
    : null;
}

/**
 * OAuth Callback Handler
 *
 * Session authority is server-side:
 * - Exchange OAuth code for Supabase session
 * - Redirect to /studio only on successful exchange
 * - Redirect to /enter on any failure
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const { origin } = requestUrl;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/enter?auth=error`);
  }

  const supabase = await createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/enter?auth=error`);
  }

  const userId = resolveUserId(data?.session) || resolveUserId(data?.user);
  const providerRefreshToken = resolveProviderRefreshToken(data?.session);
  if (userId && providerRefreshToken) {
    try {
      await storeRawRefreshToken(userId, providerRefreshToken);
    } catch (tokenStoreError) {
      console.warn("Failed to persist provider refresh token after auth callback:", tokenStoreError);
    }
  }

  return NextResponse.redirect(`${origin}/studio`);
}
