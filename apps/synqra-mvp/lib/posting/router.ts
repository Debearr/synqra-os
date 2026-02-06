import { shouldPost } from './config';
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
  payload: Record<string, unknown>,
  metadata?: PostingMetadata
): Promise<Record<string, unknown>> {
  if (!shouldPost()) {
    return {
      ok: true,
      action: 'dry-run',
      platform,
      payload,
      message: 'DRY_RUN mode - no actual post made',
    };
  }

  type PostHandler = (payload: unknown, meta?: PostingMetadata) => Promise<unknown>;
  const platformHandlers: Record<string, PostHandler> = {
    LinkedIn: postToLinkedIn as PostHandler,
    TikTok: postToTikTok as PostHandler,
    YouTube: postToYouTube as PostHandler,
    X: postToX as PostHandler,
    Instagram: postToInstagram as PostHandler,
  };

  const handler = platformHandlers[platform];
  if (!handler) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  try {
    const result = await handler(payload, metadata);
    console.log(`? Posted to ${platform}`, result);
    return { ok: true, platform, result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`? Failed to post to ${platform}:`, message);
    throw error;
  }
}
