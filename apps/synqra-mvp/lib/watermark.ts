/**
 * ============================================================
 * WATERMARK UTILITY
 * ============================================================
 * Adds "Created with Synqra" watermark to content
 * Default ON for free tier, optional for paid tiers
 */

export interface WatermarkOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  opacity?: number;
  fontSize?: number;
  enabled?: boolean;
}

/**
 * Add watermark text to content
 */
export function addTextWatermark(
  content: string,
  options: WatermarkOptions = {}
): string {
  const {
    enabled = true,
  } = options;

  if (!enabled) {
    return content;
  }

  const watermarkText = '\n\n✨ Created with Synqra\n🔗 synqra.com/pilot';
  
  return `${content}${watermarkText}`;
}

/**
 * Add watermark to image (returns HTML/CSS for overlay)
 */
export function getImageWatermarkStyles(
  options: WatermarkOptions = {}
): string {
  const {
    position = 'bottom-right',
    opacity = 0.4,
    fontSize = 12,
  } = options;

  const positions = {
    'bottom-right': 'bottom: 10px; right: 10px;',
    'bottom-left': 'bottom: 10px; left: 10px;',
    'top-right': 'top: 10px; right: 10px;',
    'top-left': 'top: 10px; left: 10px;',
  };

  return `
    position: absolute;
    ${positions[position]}
    font-size: ${fontSize}px;
    color: white;
    opacity: ${opacity};
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    font-family: system-ui, -apple-system, sans-serif;
    padding: 8px;
    background: rgba(0,0,0,0.3);
    border-radius: 4px;
  `;
}

/**
 * Check if user should have watermark based on tier
 */
export function shouldApplyWatermark(userTier: string = 'free'): boolean {
  const freeTiers = ['free', 'trial', 'atelier'];
  return freeTiers.includes(userTier.toLowerCase());
}

/**
 * Generate watermarked content for campaigns
 */
export function watermarkCampaignContent(
  content: string,
  userTier: string = 'free',
  shareLink?: string
): string {
  if (!shouldApplyWatermark(userTier)) {
    return content;
  }

  const watermark = shareLink 
    ? `\n\n✨ Created with Synqra\n🔗 ${shareLink}`
    : '\n\n✨ Created with Synqra\n🔗 synqra.com/pilot';

  return `${content}${watermark}`;
}
