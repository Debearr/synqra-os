import { NextResponse } from 'next/server';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * ============================================================
 * WAITLIST API ENDPOINT
 * ============================================================
 * Production-grade waitlist with validation and error handling
 *
 * Features:
 * - Email validation (client + server)
 * - Duplicate detection (409 for already registered)
 * - Rate limiting ready (add Vercel protection if needed)
 * - Graceful error messages
 */

// RFC 5322 simplified email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const { email, full_name } = body as { email?: unknown; full_name?: unknown };

    // Validation: Email required
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const cleanEmail = email.trim().toLowerCase();

    // Validation: Email format
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (full_name !== undefined && full_name !== null && typeof full_name !== "string") {
      return NextResponse.json(
        { ok: false, error: "full_name must be a string when provided" },
        { status: 400 }
      );
    }

    // Insert into database
    const supabaseAdmin = requireSupabaseAdmin();
    let { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert([
        {
          email: cleanEmail,
          full_name: full_name?.trim() || null,
          metadata: {
            source: 'web',
            user_agent: req.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString(),
          },
        },
      ])
      .select();

    // Backward-compatible fallback for environments where waitlist.metadata is not present yet.
    if (error?.code === "PGRST204" && error.message?.includes("'metadata'")) {
      const fallback = await supabaseAdmin
        .from("waitlist")
        .insert([
          {
            email: cleanEmail,
            full_name: full_name?.trim() || null,
          },
        ])
        .select();
      data = fallback.data;
      error = fallback.error;
    }

    // Older waitlist schemas may only accept `email`.
    if (error?.code === "PGRST204" && error.message?.includes("'full_name'")) {
      const minimal = await supabaseAdmin
        .from("waitlist")
        .insert([{ email: cleanEmail }])
        .select();
      data = minimal.data;
      error = minimal.error;
    }

    if (error) {
      // Handle duplicate email (Postgres UNIQUE constraint violation)
      if (error.code === '23505') {
        return NextResponse.json(
          {
            ok: false,
            error: 'already_registered',
            message: 'This email is already on the waitlist',
          },
          { status: 409 }
        );
      }

      console.error('[Waitlist API] Supabase insert error:', error);
      return NextResponse.json(
        { ok: false, error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    // Success
    console.log('[Waitlist API] New signup:', cleanEmail);
    return NextResponse.json({
      ok: true,
      data,
      message: 'Successfully joined waitlist',
    });
  } catch (error: unknown) {
    console.error('[Waitlist API] Unexpected error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Disabled
 * Social proof count endpoint removed per Design Constitution.
 * The POST endpoint for signups remains active.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint disabled', message: 'Social proof counts are not exposed' },
    { status: 410 }
  );
}
