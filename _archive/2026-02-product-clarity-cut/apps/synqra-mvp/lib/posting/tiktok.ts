import type { PostingMetadata } from './router';

export async function postToTikTok(payload: unknown, _meta?: PostingMetadata): Promise<unknown> {
  void payload;
  void _meta;
  console.log('?? TikTok posting stub - implement OAuth flow');
  throw new Error('TikTok integration pending - requires OAuth setup');
}
