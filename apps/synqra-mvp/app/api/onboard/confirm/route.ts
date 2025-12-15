import { NextResponse } from 'next/server';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const pilotAgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  newsletter: z.string().optional(),
  tone: z.string().optional(),
  contentPillars: z.array(z.string()).default([]),
  proofPoints: z.array(z.string()).default([]),
});

type PilotAgentInput = z.infer<typeof pilotAgentSchema>;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validationResult = pilotAgentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'validation_failed',
          message: 'Please complete required fields: name, title, company',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const supabaseAdmin = requireSupabaseAdmin();

    const email = generateTempEmail(data.name);
    const password = generateSecurePassword();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: data.name,
        onboarded_via: 'profile_extract',
        onboarded_at: new Date().toISOString(),
      },
    });

    if (authError || !authData.user) {
      console.error('[Onboard Confirm] Auth creation failed:', authError);
      return NextResponse.json(
        {
          ok: false,
          error: 'account_creation_failed',
          message: 'Failed to create user account',
        },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('pilot_agents')
      .insert([
        {
          user_id: userId,
          name: data.name,
          title: data.title,
          company: data.company,
          location: data.location || null,
          headline: data.headline || null,
          summary: data.summary || null,
          website: data.website || null,
          linkedin: data.linkedin || null,
          twitter: data.twitter || null,
          newsletter: data.newsletter || null,
          tone: data.tone || null,
          content_pillars: data.contentPillars,
          proof_points: data.proofPoints,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error('[Onboard Confirm] Profile creation failed:', profileError);

      await supabaseAdmin.auth.admin.deleteUser(userId).catch(err => {
        console.error('[Onboard Confirm] Cleanup failed:', err);
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'profile_creation_failed',
          message: 'Failed to create pilot profile',
        },
        { status: 500 }
      );
    }

    console.log('[Onboard Confirm] Success:', {
      userId,
      profileId: profile.id,
      name: data.name,
    });

    return NextResponse.json({
      ok: true,
      message: 'Profile confirmed and account created',
      data: {
        userId,
        profileId: profile.id,
        redirectUrl: '/dashboard',
        tempCredentials: {
          email,
          password,
        },
      },
    });

  } catch (error: any) {
    console.error('[Onboard Confirm] Unexpected error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'server_error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

function generateTempEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  const timestamp = Date.now().toString(36);
  return `${slug}.${timestamp}@synqra.pilot`;
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
