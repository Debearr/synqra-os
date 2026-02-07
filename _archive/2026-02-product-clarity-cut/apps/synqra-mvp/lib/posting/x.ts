import type { PostingMetadata } from './router';

export async function postToX(payload: unknown, _meta?: PostingMetadata): Promise<unknown> {
  void payload;
  void _meta;
  console.log('?? X posting stub - implement OAuth flow');
  throw new Error('X integration pending - requires OAuth setup');
}
