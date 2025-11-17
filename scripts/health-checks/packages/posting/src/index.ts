/**
 * ============================================================
 * @noid/posting
 * ============================================================
 * Social media posting engine and background queue
 * 
 * Usage:
 * import { LinkedInClient, PostingQueue, PlatformRouter } from '@noid/posting';
 */

// Export platform clients
export * from './linkedin';
export * from './x';
export * from './tiktok';
export * from './instagram';
export * from './youtube';

// Export posting infrastructure
export * from './queue';
export * from './router';
export * from './config';
