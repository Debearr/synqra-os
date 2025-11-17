/**
 * ============================================================
 * SHARED DATABASE TYPES
 * ============================================================
 * Type definitions for database tables and operations
 */

// Content Management Types
export interface ContentJob {
  id: string;
  brief: string;
  platform: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ContentVariant {
  id: string;
  job_id: string;
  hook: string;
  caption: string;
  cta: string;
  platform: string;
  variant_index: number;
  created_at: string;
}

export interface RetentionNote {
  id: string;
  platform: string;
  video_id: string;
  avg_view_duration: number | null;
  avg_completion: number | null;
  notes: string | null;
  created_at: string;
}

// Waitlist Types
export interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

// Profile & Subscription Types
export interface ProfileRow {
  id: string;
  stripe_customer_id: string | null;
  tier: string | null;
  campaigns_used: number | null;
  campaigns_limit: number | null;
  renewal_date: string | null;
}

export type PricingTierSlug = 'free' | 'starter' | 'growth' | 'scale' | 'enterprise';

// Newsletter Types
export interface NewsletterSignup {
  id?: string;
  email: string;
  company?: string;
  use_case?: string;
  source?: string;
  created_at?: string;
}

// Analytics Types
export interface DashboardMetrics {
  liveUsers: number;
  automationsTriggered: number;
  activeAutomations: number;
  scheduledContent: number;
  averageEngagementRate: number;
}

export interface AnalyticsEvent {
  id?: string;
  metric_type: string;
  value: number;
  recorded_at: string;
  metadata?: Record<string, any>;
}

// Automation Types
export interface Automation {
  id: string;
  name: string;
  is_active: boolean;
  run_count: number | null;
  updated_at: string;
  created_at: string;
}

// Post Types
export interface Post {
  id: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  platform: string;
  content: string;
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
  metadata?: Record<string, any>;
}
