import { NextResponse } from 'next/server';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';

<<<<<<< Updated upstream
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
=======
type WaitlistInsert = {
  email: string;
  full_name: string | null;
};

function summarizeDbError(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown database error";
  const message = (error as { message?: unknown }).message;
  const code = (error as { code?: unknown }).code;
  if (typeof message === "string" && typeof code === "string") {
    return `${code}: ${message}`;
  }
  if (typeof message === "string") return message;
  return "Unknown database error";
}

export async function POST(request: NextRequest) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Insert into database
    const supabaseAdmin = requireSupabaseAdmin();
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

      console.error('[Waitlist API] Supabase insert error:', error);
      return NextResponse.json(
        { ok: false, error: 'Database error. Please try again.' },
=======
        {
          error: "Database lookup failed",
          details: summarizeDbError(existingError),
        },
>>>>>>> Stashed changes
        { status: 500 }
      );
    }

<<<<<<< Updated upstream
    // Success
    console.log('[Waitlist API] New signup:', cleanEmail);
    return NextResponse.json({ 
      ok: true, 
      data,
      message: 'Successfully joined waitlist' 
=======
    if (existing?.id) {
      return NextResponse.json(
        {
          error: "Already on waitlist",
          message: "This email is already registered.",
        },
        { status: 409 }
      );
    }

    const row: WaitlistInsert = {
      email,
      full_name: fullName?.trim() || null,
    };

    const { data, error } = await supabase.from("waitlist").insert(row).select("id").single();

    if (error) {
      const isDuplicate = error.code === "23505";
      return NextResponse.json(
        {
          error: isDuplicate ? "Already on waitlist" : "Waitlist submission failed",
          details: summarizeDbError(error),
        },
        { status: isDuplicate ? 409 : 500 }
      );
    }

    const confirmation = await sendSubmissionConfirmation({
      kind: "waitlist",
      to: email,
      fullName: fullName || null,
>>>>>>> Stashed changes
    });

  } catch (e: any) {
    console.error('[Waitlist API] Unexpected error:', e);
    return NextResponse.json(
<<<<<<< Updated upstream
      { ok: false, error: 'Invalid request' },
      { status: 400 }
=======
      {
        ok: true,
        data: {
          id: data.id,
          status: "received",
        },
        confirmation,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to process waitlist request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
>>>>>>> Stashed changes
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
