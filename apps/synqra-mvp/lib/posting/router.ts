import { config, shouldPost } from './config';
import { postToLinkedIn } from './linkedin';
import { postToTikTok } from './tiktok';
import { postToYouTube } from './youtube';
import { postToX } from './x';
import { postToInstagram } from './instagram';

export interface PostingMetadata {
  jobId?: string;
  idempotencyKey?: string;
  ownerId?: string;
}

export async function routePost(
  platform: string,
  payload: any,
  metadata?: PostingMetadata
): Promise<any> {
  if (!shouldPost()) {
    return {
      ok: true,
      action: 'dry-run',
      platform,
      payload,
      message: 'DRY_RUN mode - no actual post made',
    };
  }

  const platformHandlers: Record<string, (payload: any, meta?: PostingMetadata) => Promise<any>> = {
    LinkedIn: postToLinkedIn,
    TikTok: postToTikTok,
    YouTube: postToYouTube,
    X: postToX,
    Instagram: postToInstagram,
  };

  const handler = platformHandlers[platform];
  if (!handler) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  try {
    const result = await handler(payload, metadata);
    console.log(`? Posted to ${platform}`, result);
    return { ok: true, platform, result };
  } catch (error: any) {
    console.error(`? Failed to post to ${platform}:`, error.message);
    throw error;
  }
}
