import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Initialize Supabase client lazily
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  );
}

/**
 * POST /api/pulse/share
 * Track a share link click
 */
export async function POST(request: NextRequest) {
  try {
    const { campaign_id, referrer, converted } = await request.json();

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'campaign_id is required' },
        { status: 400 }
      );
    }

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Hash IP for privacy
    const ipHash = createHash('sha256').update(ip).digest('hex');

    const supabase = getSupabaseClient();
    
    // Track share click
    const { error } = await supabase
      .from('pulse_shares')
      .insert({
        campaign_id,
        referrer,
        converted: converted || false,
        user_agent: userAgent,
        ip_hash: ipHash,
      });

    if (error) {
      console.error('[API] Share track error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Share error:', error);
    return NextResponse.json(
      { error: 'Failed to track share' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pulse/share
 * Get viral coefficient for a campaign
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaign_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    // Get share stats
    const { data: shares, error } = await supabase
      .from('pulse_shares')
      .select('*')
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('[API] Share stats error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalShares = shares?.length || 0;
    const conversions = shares?.filter(s => s.converted).length || 0;
    const viralCoefficient = totalShares > 0 ? conversions / totalShares : 0;

    return NextResponse.json({
      campaign_id: campaignId,
      total_shares: totalShares,
      conversions,
      viral_coefficient: viralCoefficient,
      share_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://synqra.com'}/pilot?ref=${campaignId}`,
    });
  } catch (error) {
    console.error('[API] Share stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get share stats' },
      { status: 500 }
    );
  }
}
