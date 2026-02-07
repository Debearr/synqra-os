import type { PostingMetadata } from './router';

export async function postToInstagram(payload: unknown, _meta?: PostingMetadata): Promise<unknown> {
  void payload;
  void _meta;
  console.log('?? Instagram posting stub - implement OAuth flow');
  throw new Error('Instagram integration pending - requires OAuth setup');
}
