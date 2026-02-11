import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/google/oauth/callback`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  return NextResponse.redirect(data.url);
}
