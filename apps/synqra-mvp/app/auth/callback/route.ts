import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";

/**
 * OAuth Callback Handler
 *
 * Session authority is server-side:
 * - Exchange OAuth code for Supabase session
 * - Redirect to /studio only on successful exchange
 * - Redirect to / on any failure
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.redirect(new URL("/studio", request.url));
}
