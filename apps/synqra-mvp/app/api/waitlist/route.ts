import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
        { status: 500 }
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
 * GET: Public waitlist count
 * Optional endpoint to show social proof ("Join 247 others")
 */
export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (e) {
    console.error('[Waitlist API] Count error:', e);
    return NextResponse.json({ count: 0 });
  }
}
