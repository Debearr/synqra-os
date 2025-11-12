import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { detectTrends } from '@/lib/kieRouter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * GET /api/pulse/trends
 * Fetch cached trends for a platform
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'all';

    let query = supabase
      .from('pulse_trends')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('score', { ascending: false });

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API] Trends fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[API] Trends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pulse/trends
 * Refresh trends for a platform using KIE.AI
 */
export async function POST(request: NextRequest) {
  try {
    const { platform } = await request.json();

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    // Detect trends using KIE.AI
    const trendTopics = await detectTrends(platform);

    if (trendTopics.length === 0) {
      return NextResponse.json(
        { error: 'No trends detected' },
        { status: 500 }
      );
    }

    // Delete expired trends for this platform
    await supabase
      .from('pulse_trends')
      .delete()
      .eq('platform', platform)
      .lt('expires_at', new Date().toISOString());

    // Insert new trends
    const trendsToInsert = trendTopics.map((topic, index) => ({
      topic,
      platform,
      score: 100 - index * 5, // Higher score for top trends
      rank: index + 1,
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
    }));

    const { data, error } = await supabase
      .from('pulse_trends')
      .insert(trendsToInsert)
      .select();

    if (error) {
      console.error('[API] Trends insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[API] Trends refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh trends' },
      { status: 500 }
    );
  }
}
