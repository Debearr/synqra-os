import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enqueue } from '@noid/posting';
import { config } from '@noid/posting';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

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
  const supabase = getSupabaseClient();
  try {
    const { jobId, variantIds, platforms, adminToken } = await req.json();

    // Validate admin token
    const expectedToken = process.env.ADMIN_TOKEN || 'change-me';
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

  } catch (error: any) {
    console.error('Approve error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
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
  const supabase = getSupabaseClient();
  try {
    const adminToken = req.nextUrl.searchParams.get('adminToken');

    // Validate admin token
    const expectedToken = process.env.ADMIN_TOKEN || 'change-me';
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

  } catch (error: any) {
    console.error('Get approvals error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
