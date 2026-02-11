import { NextResponse } from 'next/server';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';
import { pilotApplicationSchema } from '@/lib/validations/pilot-form';
import { sendApplicantConfirmation, sendAdminNotification } from '@/lib/email/notifications';

/**
 * ============================================================
 * PILOT APPLICATION API ENDPOINT
 * ============================================================
 * Phase 3: Backend Integration
 * 
 * Features:
 * - Store applications in Supabase
 * - Send confirmation email to applicant
 * - Send notification to admin
 * - Duplicate detection
 * - Input validation with Zod
 */

<<<<<<< Updated upstream
export async function POST(req: Request) {
=======
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
    // Step 1: Parse and validate request body
    const body = await req.json();
    
    // Validate with Zod schema (same as client-side)
    const validationResult = pilotApplicationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'validation_failed',
          message: 'Please check your form inputs',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Step 2: Get Supabase client
    const supabaseAdmin = requireSupabaseAdmin();

    // Step 3: Check for duplicate email
    const { data: existingApplication } = await supabaseAdmin
      .from('pilot_applications')
      .select('id, email, status')
      .eq('email', data.email.toLowerCase())
      .single();

    if (existingApplication) {
      return NextResponse.json(
        {
<<<<<<< Updated upstream
          ok: false,
          error: 'duplicate_application',
          message: 'You have already applied to the Founder Pilot program. Check your email for updates.',
=======
          error: "Database lookup failed",
          details: summarizeDbError(existingError),
        },
        { status: 500 }
      );
    }

    if (existing?.id) {
      return NextResponse.json(
        {
          error: "Application already exists",
          data: {
            id: existing.id,
            status: existing.status ?? "pending",
            appliedAt: existing.applied_at ?? null,
          },
>>>>>>> Stashed changes
        },
        { status: 409 }
      );
    }

    // Step 4: Insert application into database
    const { data: application, error: insertError } = await supabaseAdmin
      .from('pilot_applications')
      .insert([
        {
          full_name: data.fullName,
          email: data.email.toLowerCase(),
          company_name: data.companyName,
          role: data.role,
          company_size: data.companySize,
          linkedin_profile: data.linkedinProfile || null,
          why_pilot: data.whyPilot,
          status: 'pending',
          source: 'web',
          user_agent: req.headers.get('user-agent') || 'unknown',
          metadata: {
            submitted_at: new Date().toISOString(),
            referrer: req.headers.get('referer') || 'direct',
          },
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[Pilot API] Database insert error:', insertError);
      return NextResponse.json(
        {
<<<<<<< Updated upstream
          ok: false,
          error: 'database_error',
          message: 'Failed to submit application. Please try again.',
=======
          error: isDuplicate ? "Application already exists" : "Pilot application failed",
          details: summarizeDbError(error),
        },
        { status: isDuplicate ? 409 : 500 }
      );
    }

    const confirmation = await sendSubmissionConfirmation({
      kind: "pilot",
      to: email,
      fullName: data.fullName,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: inserted.id,
          status: inserted.status ?? "pending",
          appliedAt: inserted.applied_at ?? null,
        },
        confirmation,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to process pilot application",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const emailParam = request.nextUrl.searchParams.get("email");
    if (!emailParam) {
      return NextResponse.json(
        {
          error: "Missing email query parameter",
        },
        { status: 400 }
      );
    }

    const email = emailParam.trim().toLowerCase();
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("pilot_applications")
      .select("id,status,applied_at")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error: "Unable to read application status",
>>>>>>> Stashed changes
        },
        { status: 500 }
      );
    }

    // Step 5: Send email notifications (async, don't block response)
    Promise.all([
      sendApplicantConfirmation({
        fullName: data.fullName,
        email: data.email,
        companyName: data.companyName,
        role: data.role,
        companySize: data.companySize,
        linkedinProfile: data.linkedinProfile,
        whyPilot: data.whyPilot,
      }),
      sendAdminNotification({
        fullName: data.fullName,
        email: data.email,
        companyName: data.companyName,
        role: data.role,
        companySize: data.companySize,
        linkedinProfile: data.linkedinProfile,
        whyPilot: data.whyPilot,
      }),
    ])
      .then(([applicantResult, adminResult]) => {
        console.log('[Pilot API] Email notifications sent:', {
          applicant: applicantResult.success,
          admin: adminResult.success,
        });
      })
      .catch((err) => {
        console.error('[Pilot API] Email notification error:', err);
        // Don't fail the request if emails fail
      });

    // Step 6: Return success response
    console.log('[Pilot API] Application submitted successfully:', {
      id: application.id,
      email: data.email,
      company: data.companyName,
    });

    return NextResponse.json({
      ok: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        status: application.status,
      },
    });
  } catch (error: any) {
    console.error('[Pilot API] Unexpected error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'server_error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve application status by email (for future use)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = requireSupabaseAdmin();

    const { data: application, error } = await supabaseAdmin
      .from('pilot_applications')
      .select('id, status, applied_at')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !application) {
      return NextResponse.json(
        { ok: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: application.id,
        status: application.status,
        appliedAt: application.applied_at,
      },
    });
  } catch (error) {
    console.error('[Pilot API] GET error:', error);
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
