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

function isSupabaseUnreachable(error: any): boolean {
  const message = String(error?.message || "");
  const details = String(error?.details || "");
  // Common local failure modes: DNS resolution, network blocked, fetch failing
  return (
    message.includes("fetch failed") ||
    details.includes("fetch failed") ||
    details.includes("getaddrinfo ENOTFOUND") ||
    details.includes("ENOTFOUND") ||
    details.includes("ECONNREFUSED") ||
    details.includes("ETIMEDOUT")
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, full_name } = body;

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

    // Insert into database
    let supabaseAdmin;
    try {
      supabaseAdmin = requireSupabaseAdmin();
    } catch (e: any) {
      // Configuration / env issue (most common in local dev)
      const message =
        process.env.NODE_ENV === "production"
          ? "Service unavailable. Please try again later."
          : (e instanceof Error ? e.message : "Supabase admin client not configured");

      return NextResponse.json(
        { ok: false, error: "supabase_not_configured", message },
        { status: 503 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert([{ 
        email: cleanEmail, 
        full_name: full_name?.trim() || null,
        metadata: {
          source: 'web',
          user_agent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString(),
        }
      }])
      .select();

    if (error) {
      // Handle duplicate email (Postgres UNIQUE constraint violation)
      if (error.code === '23505') {
        return NextResponse.json(
          { 
            ok: false, 
            error: 'already_registered', 
            message: 'This email is already on the waitlist' 
          },
          { status: 409 }
        );
      }

      // If Supabase is unreachable locally (DNS/VPN/firewall), allow dev UX to proceed
      if (process.env.NODE_ENV !== "production" && isSupabaseUnreachable(error)) {
        console.warn("[Waitlist API] Supabase unreachable in dev; returning non-persisted success.", {
          message: error?.message,
          details: error?.details,
        });

        return NextResponse.json({
          ok: true,
          persisted: false,
          message:
            "Dev mode: Supabase is unreachable (DNS/Network). Signup not persisted, but flow allowed.",
        });
      }

      console.error('[Waitlist API] Supabase insert error:', error);
      return NextResponse.json(
        {
          ok: false,
          error: isSupabaseUnreachable(error) ? "supabase_unreachable" : "database_error",
          message: "Database error. Please try again.",
        },
        { status: isSupabaseUnreachable(error) ? 503 : 500 }
      );
    }

    // Success
    console.log('[Waitlist API] New signup:', cleanEmail);
    return NextResponse.json({ 
      ok: true, 
      data,
      message: 'Successfully joined waitlist' 
    });

  } catch (e: any) {
    console.error('[Waitlist API] Unexpected error:', e);
    return NextResponse.json(
      { ok: false, error: 'Invalid request' },
      { status: 400 }
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
