import { NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

// RFC 5322 simplified email regex.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistBody = {
  email?: unknown;
  full_name?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WaitlistBody;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email format" }, { status: 400 });
    }

    const supabaseAdmin = requireSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .insert([
        {
          email,
          full_name: fullName || null,
          metadata: {
            source: "web",
            user_agent: request.headers.get("user-agent") || "unknown",
            timestamp: new Date().toISOString(),
          },
        },
      ])
      .select();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            error: "already_registered",
            message: "This email is already on the waitlist",
          },
          { status: 409 }
        );
      }

      console.error("[Waitlist API] Supabase insert error:", error);
      return NextResponse.json({ ok: false, error: "Database error. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data,
      message: "Successfully joined waitlist",
    });
  } catch (error) {
    console.error("[Waitlist API] Unexpected error:", error);
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}

/**
 * GET: Disabled
 * Social proof count endpoint removed per Design Constitution.
 * The POST endpoint for signups remains active.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Endpoint disabled", message: "Social proof counts are not exposed" },
    { status: 410 }
  );
}