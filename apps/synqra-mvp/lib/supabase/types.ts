/**
 * ============================================================
 * SUPABASE TYPE DEFINITIONS - AI ROUTING SYSTEM
 * ============================================================
 * TypeScript types for all database tables
 */

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: Brand;
        Insert: BrandInsert;
        Update: BrandUpdate;
      };
      campaigns: {
        Row: Campaign;
        Insert: CampaignInsert;
        Update: CampaignUpdate;
      };
      content_runs: {
        Row: ContentRun;
        Insert: ContentRunInsert;
        Update: ContentRunUpdate;
      };
      content_variants: {
        Row: ContentVariant;
        Insert: ContentVariantInsert;
        Update: ContentVariantUpdate;
      };
      ai_calls: {
        Row: AICall;
        Insert: AICallInsert;
        Update: AICallUpdate;
      };
      strategies: {
        Row: Strategy;
        Insert: StrategyInsert;
        Update: StrategyUpdate;
      };
      routing_profiles: {
        Row: RoutingProfile;
        Insert: RoutingProfileInsert;
        Update: RoutingProfileUpdate;
      };
      error_logs: {
        Row: ErrorLog;
        Insert: ErrorLogInsert;
        Update: ErrorLogUpdate;
      };
    };
  };
}

// ============================================================
// BRANDS
// ============================================================
export interface Brand {
  id: string;
  name: string;
  slug: string;
  brand_voice: string | null;
  style_guide: Record<string, any> | null;
  tone_preferences: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BrandInsert {
  id?: string;
  name: string;
  slug: string;
  brand_voice?: string | null;
  style_guide?: Record<string, any> | null;
  tone_preferences?: string[] | null;
}

export interface BrandUpdate {
  name?: string;
  slug?: string;
  brand_voice?: string | null;
  style_guide?: Record<string, any> | null;
  tone_preferences?: string[] | null;
  updated_at?: string;
}

// ============================================================
// CAMPAIGNS
// ============================================================
export interface Campaign {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  target_audience: string | null;
  content_pillars: string[] | null;
  status: "draft" | "active" | "paused" | "completed";
  created_at: string;
  updated_at: string;
}

export interface CampaignInsert {
  id?: string;
  brand_id: string;
  name: string;
  description?: string | null;
  target_audience?: string | null;
  content_pillars?: string[] | null;
  status?: "draft" | "active" | "paused" | "completed";
}

export interface CampaignUpdate {
  name?: string;
  description?: string | null;
  target_audience?: string | null;
  content_pillars?: string[] | null;
  status?: "draft" | "active" | "paused" | "completed";
  updated_at?: string;
}

// ============================================================
// CONTENT RUNS
// ============================================================
export interface ContentRun {
  id: string;
  campaign_id: string;
  brief: string;
  platform: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_cost: number | null;
  total_latency_ms: number | null;
  quality_score: number | null;
  pipeline_stages: string[] | null;
  metadata: Record<string, any> | null;
  created_at: string;
  completed_at: string | null;
}

export interface ContentRunInsert {
  id?: string;
  campaign_id: string;
  brief: string;
  platform: string;
  status?: "pending" | "processing" | "completed" | "failed";
  total_cost?: number | null;
  total_latency_ms?: number | null;
  quality_score?: number | null;
  pipeline_stages?: string[] | null;
  metadata?: Record<string, any> | null;
}

export interface ContentRunUpdate {
  status?: "pending" | "processing" | "completed" | "failed";
  total_cost?: number | null;
  total_latency_ms?: number | null;
  quality_score?: number | null;
  pipeline_stages?: string[] | null;
  metadata?: Record<string, any> | null;
  completed_at?: string | null;
}

// ============================================================
// CONTENT VARIANTS
// ============================================================
export interface ContentVariant {
  id: string;
  run_id: string;
  hook: string;
  caption: string;
  cta: string;
  seo_tags: string[] | null;
  meta_description: string | null;
  variant_index: number;
  quality_score: number | null;
  created_at: string;
}

export interface ContentVariantInsert {
  id?: string;
  run_id: string;
  hook: string;
  caption: string;
  cta: string;
  seo_tags?: string[] | null;
  meta_description?: string | null;
  variant_index: number;
  quality_score?: number | null;
}

export interface ContentVariantUpdate {
  hook?: string;
  caption?: string;
  cta?: string;
  seo_tags?: string[] | null;
  meta_description?: string | null;
  quality_score?: number | null;
}

// ============================================================
// AI CALLS (Cost & Performance Tracking)
// ============================================================
export interface AICall {
  id: string;
  run_id: string | null;
  provider: "groq" | "gemini" | "deepseek" | "claude";
  model: string;
  stage: "strategy" | "draft" | "refine" | "seo" | "audit";
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  latency_ms: number;
  status: "success" | "error" | "timeout";
  error_message: string | null;
  created_at: string;
}

export interface AICallInsert {
  id?: string;
  run_id?: string | null;
  provider: "groq" | "gemini" | "deepseek" | "claude";
  model: string;
  stage: "strategy" | "draft" | "refine" | "seo" | "audit";
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  latency_ms: number;
  status: "success" | "error" | "timeout";
  error_message?: string | null;
}

export interface AICallUpdate {
  status?: "success" | "error" | "timeout";
  error_message?: string | null;
}

// ============================================================
// STRATEGIES (DeepSeek Output Cache)
// ============================================================
export interface Strategy {
  id: string;
  campaign_id: string;
  strategy_data: Record<string, any>;
  audience_insights: string[] | null;
  content_angles: string[] | null;
  hooks_library: string[] | null;
  expires_at: string | null;
  created_at: string;
}

export interface StrategyInsert {
  id?: string;
  campaign_id: string;
  strategy_data: Record<string, any>;
  audience_insights?: string[] | null;
  content_angles?: string[] | null;
  hooks_library?: string[] | null;
  expires_at?: string | null;
}

export interface StrategyUpdate {
  strategy_data?: Record<string, any>;
  audience_insights?: string[] | null;
  content_angles?: string[] | null;
  hooks_library?: string[] | null;
  expires_at?: string | null;
}

// ============================================================
// ROUTING PROFILES (Adaptive Routing Config)
// ============================================================
export interface RoutingProfile {
  id: string;
  name: string;
  groq_quality_threshold: number;
  gemini_quality_threshold: number;
  max_cost_per_item: number;
  enabled_stages: string[];
  created_at: string;
  updated_at: string;
}

export interface RoutingProfileInsert {
  id?: string;
  name: string;
  groq_quality_threshold?: number;
  gemini_quality_threshold?: number;
  max_cost_per_item?: number;
  enabled_stages?: string[];
}

export interface RoutingProfileUpdate {
  name?: string;
  groq_quality_threshold?: number;
  gemini_quality_threshold?: number;
  max_cost_per_item?: number;
  enabled_stages?: string[];
  updated_at?: string;
}

// ============================================================
// ERROR LOGS
// ============================================================
export interface ErrorLog {
  id: string;
  run_id: string | null;
  stage: string | null;
  provider: string | null;
  error_type: string;
  error_message: string;
  stack_trace: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ErrorLogInsert {
  id?: string;
  run_id?: string | null;
  stage?: string | null;
  provider?: string | null;
  error_type: string;
  error_message: string;
  stack_trace?: string | null;
  metadata?: Record<string, any> | null;
}

export interface ErrorLogUpdate {
  // Error logs are immutable
}

// ============================================================
// LEGACY TYPES (Backward Compatibility)
// ============================================================
export interface ContentJob {
  id: string;
  brief: string;
  platform: string;
  status: string;
  created_at: string;
  updated_at?: string;
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
