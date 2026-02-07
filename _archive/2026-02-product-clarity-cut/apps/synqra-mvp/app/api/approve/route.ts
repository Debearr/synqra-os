import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseAdmin } from '@/lib/supabaseAdmin';
import { enqueue } from '@/lib/posting/queue';
import { config } from '@/lib/posting/config';
import { buildPostingIdempotencyKey } from '@/lib/posting/idempotency';

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
    const expectedToken = process.env.ADMIN_TOKEN;
    if (!expectedToken) {
      return NextResponse.json(
        { ok: false, error: 'ADMIN_TOKEN not configured' },
        { status: 500 }
      );
    }

    const { jobId, variantIds, platforms, adminToken } = await req.json();

    // Validate admin token
    if (!adminToken || adminToken !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - invalid admin token' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!jobId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { ok: false, error: 'Missing jobId or platforms' },
        { status: 400 }
      );
    }

    // Check if posting is enabled
    if (!config.postingEnabled && !config.dryRun) {
      return NextResponse.json(
        { ok: false, error: 'Posting disabled by system configuration' },
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
        { ok: false, error: 'Job not found' },
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
        { ok: false, error: 'No variants found' },
        { status: 404 }
      );
    }

    // Queue posts for each platform
    const enqueued: { platform: string; variantId: string }[] = [];

    for (const platform of platforms) {
      // Find variant for this platform
      const variant = variants.find(v => v.platform === platform);

      if (!variant) {
        console.warn(`??  No variant found for platform: ${platform}`);
        continue;
      }

      // Prepare payload
      const payload: Record<string, unknown> = {
        text: variant.content,
      };

      // Add media if present
      if (variant.media_url) {
        payload.media = [{
          url: variant.media_url,
          title: variant.media_metadata?.title || '',
        }];
      }

      const idempotencyKey = buildPostingIdempotencyKey({
        jobId,
        platform,
        variantId: variant.id,
        payload,
      });

      // Enqueue the post
      const result = await enqueue({
        platform,
        payload,
        jobId,
        variantId: variant.id,
        idempotencyKey,
      });

      if (!result.enqueued) {
        continue;
      }

      enqueued.push({
        platform,
        variantId: variant.id,
      });

      // Create scheduled post record
      await supabase.from('scheduled_posts').insert({
        job_id: jobId,
        variant_id: variant.id,
        platform,
        scheduled_for: new Date().toISOString(),
        status: 'queued',
      });
    }

    return NextResponse.json({
      ok: true,
      jobId,
      approved: true,
      enqueued,
      dryRun: config.dryRun,
      message: config.dryRun
        ? `Approved in DRY_RUN mode - ${enqueued.length} jobs queued (no actual posts)`
        : `Approved and queued ${enqueued.length} posts`,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Approve error:', message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
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
    const expectedToken = process.env.ADMIN_TOKEN;
    if (!expectedToken) {
      return NextResponse.json(
        { ok: false, error: 'ADMIN_TOKEN not configured' },
        { status: 500 }
      );
    }

    const adminToken = req.nextUrl.searchParams.get('adminToken');

    // Validate admin token
    if (!adminToken || adminToken !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
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
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Get approvals error:', message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
