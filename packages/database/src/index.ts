/**
 * ============================================================
 * @noid/database
 * ============================================================
 * Shared Supabase client and database types
 * 
 * Usage:
 * import { supabase, supabaseAdmin, ContentJob } from '@noid/database';
 */

// Export clients
export { supabase } from './client';
export { supabaseAdmin } from './admin';

// Export all types
export type * from './types';
export type {
  ContentJob,
  ContentVariant,
  RetentionNote,
  WaitlistEntry,
  ProfileRow,
  PricingTierSlug,
  NewsletterSignup,
  DashboardMetrics,
  AnalyticsEvent,
  Automation,
  Post,
} from './types';
