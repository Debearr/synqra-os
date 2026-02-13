import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { storeRawRefreshToken } from "@/lib/integrations/google/token-store";

type ExchangeSession = {
  id?: string | null;
  user?: { id?: string | null } | null;
  provider_refresh_token?: string | null;
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/enter?auth=error`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const userId = resolveUserId(data?.session) || resolveUserId(data?.user);
      const providerRefreshToken = resolveProviderRefreshToken(data?.session);
      if (userId && providerRefreshToken) {
        try {
          await storeRawRefreshToken(userId, providerRefreshToken);
        } catch (tokenStoreError) {
          console.warn("Failed to persist Google refresh token after OAuth callback:", tokenStoreError);
        }
      }
      return NextResponse.redirect(`${origin}/studio`);
    }
  }

  return NextResponse.redirect(`${origin}/enter?auth=error`);
}
