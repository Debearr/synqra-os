import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";

/**
 * OAuth Callback Handler
 * 
 * OAuth as Identity Restorer (NOT Auth Gate):
 * - Exchanges OAuth code for Supabase session
 * - If synqra_auth cookie is missing, generates identity code and sets cookie
 * - Always redirects to /studio (never blocks)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    // On error, still redirect to /studio (OAuth doesn't gate access)
    return NextResponse.redirect(new URL("/studio", request.url));
  }

  if (!code) {
    // No code, still redirect to /studio
    return NextResponse.redirect(new URL("/studio", request.url));
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());

  // Exchange code for session (but don't gate on success/failure)
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  // Check if synqra_auth cookie exists
  const existingCookie = request.cookies.get("synqra_auth")?.value;

  // If cookie is missing, generate identity code and set it
  if (!existingCookie) {
    let identityCode: string;
    
    // Try to get user info to generate identity code
    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser();
      identityCode = user?.email 
        ? `oauth-${user.email.split('@')[0]}-${Date.now().toString(36)}`
        : `oauth-${Date.now().toString(36)}`;
    } else {
      // Exchange failed, generate random identity code anyway
      identityCode = `oauth-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
    }

    const response = NextResponse.redirect(new URL("/studio", request.url));
    
    // Set synqra_auth cookie
    response.cookies.set("synqra_auth", identityCode, {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  }

  // Cookie already exists, just redirect to /studio
  return NextResponse.redirect(new URL("/studio", request.url));
}

