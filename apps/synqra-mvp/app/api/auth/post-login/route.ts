import { NextResponse } from "next/server";
import { resolvePostLoginState } from "@/lib/auth/post-login";
import { createClient } from "@/utils/supabase/server";

type PostLoginBody = {
  nextPath?: string | null;
};

export async function POST(request: Request) {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (error) {
    return NextResponse.json(
      {
        error: "supabase_config_error",
        message: error instanceof Error ? error.message : "Supabase client configuration failed",
      },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = ((await request.json().catch(() => ({}))) ?? {}) as PostLoginBody;
  const { role, redirectTo } = await resolvePostLoginState({
    userId: user.id,
    email: user.email ?? null,
    nextPath: body.nextPath ?? null,
  });

  return NextResponse.json({
    role,
    redirectTo,
  });
}
