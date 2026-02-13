/**
 * ============================================================
 * CONTENT GENERATOR
 * ============================================================
 * Zero-cost hook and CTA generator for platform-native content
 * Uses simple templating - can be enhanced with AI later
 */

export interface ContentVariant {
  hook: string;
  caption: string;
  cta: string;
  platform: string;
  variantIndex: number;
}

export type Platform = "youtube" | "tiktok" | "x" | "linkedin" | "instagram";

const HOOK_TEMPLATES = {
  youtube: [
    (brief: string) => `In this video: ${brief}`,
    (brief: string) => `Here's what you need to know about ${brief}`,
    (brief: string) => `Watch this if you want to understand ${brief}`,
  ],
  tiktok: [
    (brief: string) => `POV: ${brief}`,
    (brief: string) => `Wait for it... ${brief}`,
    (brief: string) => `This changed everything: ${brief}`,
  ],
  x: [
    (brief: string) => `Thread: ${brief}`,
    (brief: string) => `Quick breakdown of ${brief} 👇`,
    (brief: string) => `${brief} - here's what actually matters:`,
  ],
  linkedin: [
    (brief: string) => `${brief} - insights from the field`,
    (brief: string) => `Lessons learned: ${brief}`,
    (brief: string) => `${brief} | A practical guide`,
  ],
  instagram: [
    (brief: string) => `${brief} in one move.`,
    (brief: string) => `${brief} - save this for later.`,
    (brief: string) => `${brief}, made simple.`,
  ],
};

const CTA_TEMPLATES = {
  youtube: "Like and subscribe for more content like this",
  tiktok: "Follow for daily tips",
  x: "Repost if this helped you",
  linkedin: "Connect with me for more insights",
  instagram: "Save this and share with your team",
};

/**
 * Generate platform-native hooks from a brief
 */
export function generateHooks(
  brief: string,
  platform: Platform
): ContentVariant[] {
  const templates = HOOK_TEMPLATES[platform] || HOOK_TEMPLATES.youtube;
  const cta = CTA_TEMPLATES[platform] || CTA_TEMPLATES.youtube;

  return templates.map((template, index) => ({
    hook: template(brief),
    caption: `${brief}`,
    cta,
    platform,
    variantIndex: index + 1,
  }));
}

/**
 * Generate hooks for multiple platforms
 */
export function generateMultiPlatform(
  brief: string,
  platforms: Platform[]
): Record<Platform, ContentVariant[]> {
  const result: Record<string, ContentVariant[]> = {};

  for (const platform of platforms) {
    result[platform] = generateHooks(brief, platform);
  }

  return result;
}

/**
 * Log content generation activity
 */
export function logContentGeneration(
  jobId: string,
  brief: string,
  platforms: string[]
): void {
  const timestamp = new Date().toISOString();
  const logLine = `[CONTENT-GEN] ${timestamp} | Job: ${jobId} | Brief: "${brief.substring(0, 50)}..." | Platforms: ${platforms.join(", ")}`;
  console.log(logLine);

  // In production, append to /infra/logs/app/content.log
  // Serverless environments may not support file I/O, so we use console.log
}
