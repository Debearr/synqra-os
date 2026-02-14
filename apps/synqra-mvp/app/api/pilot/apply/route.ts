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

export async function POST(req: Request) {
  try {
    // Step 1: Parse and validate request body
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_request_payload",
          message: "Request body must be a JSON object",
        },
        { status: 400 }
      );
    }

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
    const { data: existingApplication, error: duplicateLookupError } = await supabaseAdmin
      .from('pilot_applications')
      .select('id, email, status')
      .eq('email', data.email.toLowerCase())
      .maybeSingle();

    if (duplicateLookupError) {
      console.error('[Pilot API] Duplicate lookup error:', duplicateLookupError);
      return NextResponse.json(
        {
          ok: false,
          error: 'database_error',
          message: 'Failed to validate existing applications. Please try again.',
        },
        { status: 500 }
      );
    }

    if (existingApplication) {
      return NextResponse.json(
        {
          ok: false,
          error: 'duplicate_application',
          message: 'You have already applied to the Founder Pilot program. Check your email for updates.',
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
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            ok: false,
            error: 'duplicate_application',
            message: 'You have already applied to the Founder Pilot program. Check your email for updates.',
          },
          { status: 409 }
        );
      }
      console.error('[Pilot API] Database insert error:', insertError);
      return NextResponse.json(
        {
          ok: false,
          error: 'database_error',
          message: 'Failed to submit application. Please try again.',
        },
        { status: 500 }
      );
    }

    // Step 5: Send email notifications
    await Promise.all([
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
    ]);

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
  } catch (error: unknown) {
    console.error('[Pilot API] Unexpected error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
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
