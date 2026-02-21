import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { REDIRECT_PATHS } from "@/lib/redirects";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL(REDIRECT_PATHS.ROOT, request.url));
}
