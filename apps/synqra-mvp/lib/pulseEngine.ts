/**
 * ============================================================
 * PULSEENGINE CORE LOGIC
 * ============================================================
 * Trend detection, campaign generation, and automation orchestration
 */

import { generateTrendContent, detectTrends } from './kieRouter';
import { generateHooks, type Platform } from './contentGenerator';

export interface Trend {
  id: string;
  topic: string;
  platform: string;
  score: number;
  rank: number;
  cached_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  trends: string[];
  platforms: Platform[];
  variants: Record<Platform, CampaignVariant[]>;
  created_at: string;
}

export interface CampaignVariant {
  platform: Platform;
  hook: string;
  caption: string;
  cta: string;
  trend_context: string[];
}

/**
 * Fetch cached trends for a platform
 */
export async function getCachedTrends(platform: Platform): Promise<Trend[]> {
  try {
    const response = await fetch(`/api/pulse/trends?platform=${platform}`);
    if (!response.ok) throw new Error('Failed to fetch trends');
    return await response.json();
  } catch (error) {
    console.error('[PulseEngine] Error fetching trends:', error);
    return [];
  }
}

/**
 * Refresh trends for a platform
 */
export async function refreshTrends(platform: Platform): Promise<Trend[]> {
  try {
    const response = await fetch('/api/pulse/trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    if (!response.ok) throw new Error('Failed to refresh trends');
    return await response.json();
  } catch (error) {
    console.error('[PulseEngine] Error refreshing trends:', error);
    return [];
  }
}

/**
 * Generate a campaign using trends and brand voice
 */
export async function generateCampaign(
  brief: string,
  selectedTrends: string[],
  platforms: Platform[]
): Promise<Campaign> {
  const variants: Record<Platform, CampaignVariant[]> = {} as any;

  // Generate content for each platform
  for (const platform of platforms) {
    try {
      // Use KIE.AI for trend-aware content
      const trendContent = await generateTrendContent(brief, selectedTrends, platform);
      
      // Generate platform-native variants
      const platformVariants = generateHooks(trendContent, platform);
      
      // Add trend context to each variant
      variants[platform] = platformVariants.map(v => ({
        platform: v.platform as Platform,
        hook: v.hook,
        caption: v.caption,
        cta: v.cta,
        trend_context: selectedTrends,
      }));
    } catch (error) {
      console.error(`[PulseEngine] Error generating for ${platform}:`, error);
      // Fallback to template-based generation
      variants[platform] = generateHooks(brief, platform).map(v => ({
        platform: v.platform as Platform,
        hook: v.hook,
        caption: v.caption,
        cta: v.cta,
        trend_context: selectedTrends,
      }));
    }
  }

  return {
    id: crypto.randomUUID(),
    name: `${brief.substring(0, 30)}... Campaign`,
    trends: selectedTrends,
    platforms,
    variants,
    created_at: new Date().toISOString(),
  };
}

/**
 * Schedule a campaign for posting
 */
export async function scheduleCampaign(
  campaign: Campaign,
  scheduledFor: Date
): Promise<{ success: boolean; jobIds: string[] }> {
  try {
    const response = await fetch('/api/pulse/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign,
        scheduled_for: scheduledFor.toISOString(),
      }),
    });

    if (!response.ok) throw new Error('Failed to schedule campaign');
    return await response.json();
  } catch (error) {
    console.error('[PulseEngine] Error scheduling campaign:', error);
    return { success: false, jobIds: [] };
  }
}

/**
 * Generate a viral share link for a campaign
 */
export function generateShareLink(campaignId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://synqra.com';
  return `${baseUrl}/pilot?ref=${campaignId}`;
}

/**
 * Track a share click
 */
export async function trackShareClick(
  campaignId: string,
  referrer?: string
): Promise<void> {
  try {
    await fetch('/api/pulse/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaignId,
        referrer,
      }),
    });
  } catch (error) {
    console.error('[PulseEngine] Error tracking share:', error);
  }
}
