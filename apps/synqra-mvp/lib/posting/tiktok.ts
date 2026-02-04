import type { PostingMetadata } from './router';

export async function postToTikTok(payload: any, _meta?: PostingMetadata): Promise<any> {
  console.log('?? TikTok posting stub - implement OAuth flow');
  throw new Error('TikTok integration pending - requires OAuth setup');
}
