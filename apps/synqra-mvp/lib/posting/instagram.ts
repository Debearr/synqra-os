import type { PostingMetadata } from './router';

export async function postToInstagram(payload: any, _meta?: PostingMetadata): Promise<any> {
  console.log('?? Instagram posting stub - implement OAuth flow');
  throw new Error('Instagram integration pending - requires OAuth setup');
}
