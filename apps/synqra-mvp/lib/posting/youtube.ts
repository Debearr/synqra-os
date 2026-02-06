import type { PostingMetadata } from './router';

export async function postToYouTube(_payload: unknown, _meta?: PostingMetadata): Promise<unknown> {
  void _payload;
  void _meta;
  console.log('?? YouTube posting stub - implement OAuth flow');
  throw new Error('YouTube integration pending - requires OAuth setup');
}
