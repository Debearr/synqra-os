/**
 * ============================================================
 * SHARE LINK UTILITY
 * ============================================================
 * Generates trackable share links for viral loop
 */

/**
 * Generate a trackable share link for a campaign
 */
export function generateShareLink(
  campaignId: string,
  baseUrl: string = 'https://synqra.com'
): string {
  return `${baseUrl}/pilot?ref=${campaignId}`;
}

/**
 * Parse campaign ID from share link
 */
export function parseCampaignId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref');
  } catch {
    return null;
  }
}

/**
 * Generate share text with link
 */
export function generateShareText(
  content: string,
  campaignId: string
): string {
  const shareLink = generateShareLink(campaignId);
  return `${content}\n\n🔗 ${shareLink}`;
}

/**
 * Calculate viral coefficient
 */
export function calculateViralCoefficient(
  totalShares: number,
  conversions: number
): number {
  if (totalShares === 0) return 0;
  return conversions / totalShares;
}

/**
 * Get viral growth status
 */
export function getViralStatus(coefficient: number): {
  status: string;
  emoji: string;
  message: string;
} {
  if (coefficient >= 1.0) {
    return {
      status: 'Viral',
      emoji: '🚀',
      message: 'Exponential viral growth!',
    };
  } else if (coefficient >= 0.5) {
    return {
      status: 'Growing',
      emoji: '📈',
      message: 'Strong organic growth',
    };
  } else {
    return {
      status: 'Starting',
      emoji: '🌱',
      message: 'Building momentum',
    };
  }
}
