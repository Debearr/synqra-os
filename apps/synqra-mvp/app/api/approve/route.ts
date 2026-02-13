import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/app/api/_shared/admin-access';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';
import { enqueue } from '@/lib/posting/queue';
import { config } from '@/lib/posting/config';
import {
  enforceBudget,
  enforceKillSwitch,
  ensureCorrelationId,
  normalizeError,
  requireConfirmation,
  logSafeguard,
} from '@/lib/safeguards';

/**
 * Approve and Publish Content
 *
 * When APPROVAL_REQUIRED=true, content must be approved before posting
 * This endpoint handles the approval and triggers the posting queue
 *
 * POST /api/approve
 * Body: {
 *   jobId: string,
 *   variantIds?: string[],  // Optional: specific variants to approve
 *   platforms: string[],     // Platforms to publish to
 *   adminToken: string       // Admin authentication
 * }
 */
export async function POST(req: NextRequest) {
  const supabase = requireSupabaseAdmin();
  try {
    const correlationId = ensureCorrelationId(req.headers.get('x-correlation-id'));
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON body', correlationId },
        { status: 400 }
      );
    }

    const { jobId, variantIds, platforms, adminToken, confirmed } = body as {
      jobId?: string;
      variantIds?: string[];
      platforms?: string[];
      adminToken?: string;
      confirmed?: boolean;
    };

    logSafeguard({
      level: 'info',
      message: 'approve.request.start',
      scope: 'approve',
      correlationId,
      data: { jobId, platforms },
    });

    enforceKillSwitch({ scope: 'approve', correlationId });
    requireConfirmation({
      confirmed,
      context: 'Approve and publish content to external platforms',
      correlationId,
    });

    const adminAccess = verifyAdminAccess(req, { bodyToken: adminToken ?? null });
    if (!adminAccess.ok) {
      return NextResponse.json(
        { ok: false, error: adminAccess.error, correlationId },
        { status: adminAccess.status }
      );
    }

    // Validate required fields
    if (!jobId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { ok: false, error: 'Missing jobId or platforms', correlationId },
        { status: 400 }
      );
    }

    enforceBudget({
      estimatedCost: Math.max(0.02 * platforms.length, 0.02),
      scope: 'approve',
      correlationId,
    });

    // Check if posting is enabled
    if (!config.postingEnabled && !config.dryRun) {
      return NextResponse.json(
        { ok: false, error: 'Posting disabled by system configuration', correlationId },
        { status: 403 }
      );
    }

    // Fetch the content job
    const { data: job, error: jobError } = await supabase
      .from('content_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { ok: false, error: 'Job not found', correlationId },
        { status: 404 }
      );
    }

    // Fetch variants
    let query = supabase
      .from('content_variants')
      .select('*')
      .eq('job_id', jobId);

    if (variantIds && variantIds.length > 0) {
      query = query.in('id', variantIds);
    }

    const { data: variants, error: variantsError } = await query;

    if (variantsError || !variants || variants.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No variants found', correlationId },
        { status: 404 }
      );
    }

    // Queue posts for each platform
    const enqueued: { platform: string; variantId: string }[] = [];

    for (const platform of platforms) {
      // Find variant for this platform
      const variant = variants.find(v => v.platform === platform);

      if (!variant) {
        console.warn(`⚠️  No variant found for platform: ${platform}`);
        continue;
      }

      // Prepare payload
      const payload: any = {
        text: variant.content,
      };

      // Add media if present
      if (variant.media_url) {
        payload.media = [{
          url: variant.media_url,
          title: variant.media_metadata?.title || '',
        }];
      }

      // Enqueue the post
      enqueue({
        platform,
        payload,
        jobId,
      });

      enqueued.push({
        platform,
        variantId: variant.id,
      });

    }

    logSafeguard({
      level: 'info',
      message: 'approve.request.success',
      scope: 'approve',
      correlationId,
      data: { jobId, enqueuedCount: enqueued.length, dryRun: config.dryRun },
    });

    return NextResponse.json({
      ok: true,
      jobId,
      approved: true,
      enqueued,
      dryRun: config.dryRun,
      message: config.dryRun
        ? `Approved in DRY_RUN mode - ${enqueued.length} jobs queued (no actual posts)`
        : `Approved and queued ${enqueued.length} posts`,
      correlationId,
    });

  } catch (error: any) {
    const normalized = normalizeError(error);
    const correlationId = ensureCorrelationId(
      (error as any)?.correlationId || undefined
    );
    logSafeguard({
      level: 'error',
      message: 'approve.request.error',
      scope: 'approve',
      correlationId,
      data: { error: normalized.code },
    });
    return NextResponse.json(
      { ok: false, error: normalized.safeMessage, correlationId },
      { status: normalized.status }
    );
  }
}

/**
 * Get Pending Approvals
 *
 * GET /api/approve?adminToken=xxx
 */
export async function GET(req: NextRequest) {
  const supabase = requireSupabaseAdmin();
  try {
    const correlationId = ensureCorrelationId(req.headers.get('x-correlation-id'));

    const adminAccess = verifyAdminAccess(req);
    if (!adminAccess.ok) {
      return NextResponse.json(
        { ok: false, error: adminAccess.error, correlationId },
        { status: adminAccess.status }
      );
    }

    // Get all content jobs with their variants
    const { data: jobs, error } = await supabase
      .from('content_jobs')
      .select(`
        *,
        variants:content_variants(*)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      jobs: jobs || [],
      total: jobs?.length || 0,
      correlationId,
    });

  } catch (error: any) {
    const normalized = normalizeError(error);
    const correlationId = ensureCorrelationId(
      (error as any)?.correlationId || undefined
    );
    logSafeguard({
      level: 'error',
      message: 'approve.list.error',
      scope: 'approve',
      correlationId,
      data: { error: normalized.code },
    });
    return NextResponse.json(
      { ok: false, error: normalized.safeMessage, correlationId },
      { status: normalized.status }
    );
  }
}
