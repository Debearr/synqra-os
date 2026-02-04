import type { PostingMetadata } from './router';

export async function postToX(payload: any, _meta?: PostingMetadata): Promise<any> {
  console.log('?? X posting stub - implement OAuth flow');
  throw new Error('X integration pending - requires OAuth setup');
}
