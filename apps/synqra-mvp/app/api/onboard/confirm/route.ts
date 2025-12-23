import { NextResponse } from 'next/server';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import {
  enforceKillSwitch,
  ensureCorrelationId,
  normalizeError,
  requireConfirmation,
  logSafeguard,
} from '@/lib/safeguards';

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
    const correlationId = ensureCorrelationId(req.headers.get('x-correlation-id'));
    const body = await req.json();

    logSafeguard({
      level: 'info',
      message: 'onboard.confirm.start',
      scope: 'onboard-confirm',
      correlationId,
      data: { name: body?.name },
    });

    enforceKillSwitch({ scope: 'onboard-confirm', correlationId });
    requireConfirmation({
      confirmed: body?.confirmed,
      context: 'Create pilot agent account',
      correlationId,
    });

    const validationResult = pilotAgentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'validation_failed',
          message: 'Please complete required fields: name, title, company',
          details: validationResult.error.issues,
          correlationId,
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
      logSafeguard({
        level: 'error',
        message: 'onboard.confirm.auth.failed',
        scope: 'onboard-confirm',
        correlationId,
        data: { error: authError?.message },
      });
      return NextResponse.json(
        {
          ok: false,
          error: 'account_creation_failed',
          message: 'Failed to create user account',
          correlationId,
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
      logSafeguard({
        level: 'error',
        message: 'onboard.confirm.profile.failed',
        scope: 'onboard-confirm',
        correlationId,
        data: { error: profileError?.message },
      });

      await supabaseAdmin.auth.admin.deleteUser(userId).catch(err => {
        logSafeguard({
          level: 'warn',
          message: 'onboard.confirm.cleanup.failed',
          scope: 'onboard-confirm',
          correlationId,
          data: { error: err?.message },
        });
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'profile_creation_failed',
          message: 'Failed to create pilot profile',
          correlationId,
        },
        { status: 500 }
      );
    }

    logSafeguard({
      level: 'info',
      message: 'onboard.confirm.success',
      scope: 'onboard-confirm',
      correlationId,
      data: { userId, profileId: profile.id, name: data.name },
    });

    return NextResponse.json({
      ok: true,
      message: 'Profile confirmed and account created',
      data: {
        userId,
        profileId: profile.id,
        redirectUrl: '/',
        tempCredentials: {
          email,
          password,
        },
      },
      correlationId,
    });

  } catch (error: any) {
    const normalized = normalizeError(error);
    const correlationId = ensureCorrelationId(
      (error as any)?.correlationId || undefined
    );
    logSafeguard({
      level: 'error',
      message: 'onboard.confirm.error',
      scope: 'onboard-confirm',
      correlationId,
      data: { error: normalized.code },
    });
    return NextResponse.json(
      {
        ok: false,
        error: normalized.code,
        message: normalized.safeMessage,
        correlationId,
      },
      { status: normalized.status }
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
