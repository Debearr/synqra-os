import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTrendContent } from '@/lib/kieRouter';
import { generateHooks, type Platform } from '@/lib/contentGenerator';

// Initialize Supabase client lazily
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  );
}

/**
 * POST /api/pulse/generate
 * Generate a trend-based campaign
 */
export async function POST(request: NextRequest) {
  try {
    const { brief, trends, platforms, user_id } = await request.json();

    if (!brief || !trends || !platforms || !user_id) {
      return NextResponse.json(
        { error: 'brief, trends, platforms, and user_id are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    // Check token limits
    const { data: tokenData } = await supabase
      .from('pulse_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (tokenData && tokenData.tokens_used >= tokenData.tokens_limit) {
      return NextResponse.json(
        { error: 'Token limit exceeded. Please upgrade or wait for reset.' },
        { status: 429 }
      );
    }

    // Generate campaign variants for each platform
    const campaignVariants: Record<string, any[]> = {};

    for (const platform of platforms) {
      try {
        // Use KIE.AI for trend-aware content
        const trendContent = await generateTrendContent(brief, trends, platform);
        
        // Generate platform-native variants
        const variants = generateHooks(trendContent, platform as Platform);
        
        campaignVariants[platform] = variants.map(v => ({
          ...v,
          trend_context: trends,
        }));
      } catch (error) {
        console.error(`[API] Error generating for ${platform}:`, error);
        // Fallback to template-based
        const variants = generateHooks(brief, platform as Platform);
        campaignVariants[platform] = variants.map(v => ({
          ...v,
          trend_context: trends,
        }));
      }
    }

    // Save campaign to database
    const { data: campaign, error: campaignError } = await supabase
      .from('pulse_campaigns')
      .insert({
        user_id,
        name: `${brief.substring(0, 30)}... Campaign`,
        campaign_json: campaignVariants,
        trend_context: trends,
        platforms,
        status: 'draft',
      })
      .select()
      .single();

    if (campaignError) {
      console.error('[API] Campaign save error:', campaignError);
      return NextResponse.json(
        { error: campaignError.message },
        { status: 500 }
      );
    }

    // Update token usage
    if (tokenData) {
      await supabase
        .from('pulse_tokens')
        .update({ tokens_used: tokenData.tokens_used + platforms.length })
        .eq('user_id', user_id);
    } else {
      // Create token record
      await supabase
        .from('pulse_tokens')
        .insert({
          user_id,
          tokens_used: platforms.length,
          tokens_limit: 100,
        });
    }

    return NextResponse.json({
      campaign_id: campaign.id,
      variants: campaignVariants,
      tokens_used: (tokenData?.tokens_used || 0) + platforms.length,
      tokens_remaining: (tokenData?.tokens_limit || 100) - ((tokenData?.tokens_used || 0) + platforms.length),
    });
  } catch (error) {
    console.error('[API] Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate campaign' },
      { status: 500 }
    );
  }
}
