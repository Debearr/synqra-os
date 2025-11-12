import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily to avoid build-time errors
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  );
}

/**
 * POST /api/pulse/schedule
 * Schedule a campaign for automated posting
 */
export async function POST(request: NextRequest) {
  try {
    const { campaign_id, scheduled_for, user_id } = await request.json();

    if (!campaign_id || !scheduled_for || !user_id) {
      return NextResponse.json(
        { error: 'campaign_id, scheduled_for, and user_id are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('pulse_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('user_id', user_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Update campaign status and schedule time
    await supabase
      .from('pulse_campaigns')
      .update({
        status: 'scheduled',
        scheduled_for,
      })
      .eq('id', campaign_id);

    // Create content jobs for each platform/variant
    const jobIds: string[] = [];
    const campaignVariants = campaign.campaign_json;

    for (const [platform, variants] of Object.entries(campaignVariants)) {
      for (const variant of variants as any[]) {
        const { data: job, error: jobError } = await supabase
          .from('content_jobs')
          .insert({
            brief: variant.caption,
            platform,
            status: 'scheduled',
            source: 'pulse',
            metadata: {
              campaign_id,
              trend_context: variant.trend_context,
              hook: variant.hook,
              cta: variant.cta,
            },
          })
          .select()
          .single();

        if (!jobError && job) {
          jobIds.push(job.id);

          // Create content variant
          await supabase
            .from('content_variants')
            .insert({
              job_id: job.id,
              hook: variant.hook,
              caption: variant.caption,
              cta: variant.cta,
              platform,
              variant_index: 1,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      campaign_id,
      job_ids: jobIds,
      scheduled_for,
    });
  } catch (error) {
    console.error('[API] Schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule campaign' },
      { status: 500 }
    );
  }
}
