import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  // Must be allowed in Supabase Auth redirect URLs:
  // - ${origin}/api/google/oauth/callback
  // - ${origin}/enter
  // - ${origin}/studio
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/google/oauth/callback`,
      scopes: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/enter?auth=error`);
  }

  return NextResponse.redirect(data.url);
}
