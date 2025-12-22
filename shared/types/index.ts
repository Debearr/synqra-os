/**
 * ============================================================
 * SHARED TYPES - NØID LABS
 * ============================================================
 * Consolidated TypeScript types across the ecosystem
 * 
 * Single source of truth for common data structures
 * Apple/Tesla principle: Define once, use everywhere
 */

import { z } from "zod";

// ============================================================
// CORE TYPES
// ============================================================

export type App = "synqra" | "noid" | "aurafx" | "shared";
export type Environment = "development" | "staging" | "production";
export type Status = "pending" | "processing" | "completed" | "failed" | "cancelled";

// ============================================================
// USER & PROFILE
// ============================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  tier?: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  tier: "free" | "pro" | "enterprise" | null;
  campaigns_used: number;
  campaigns_limit: number | null; // null = no cap explicitly set
  renewal_date?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// CONTENT GENERATION
// ============================================================

export type ContentType = "email" | "social" | "script" | "copy" | "campaign";
export type Platform = "linkedin" | "twitter" | "instagram" | "tiktok" | "youtube";
export type OutputMode = "prototype" | "polished";

export interface ContentJob {
  id: string;
  user_id?: string;
  brief: string;
  type: ContentType;
  platform?: Platform;
  status: Status;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface ContentVariant {
  id: string;
  job_id: string;
  content: string;
  variant_index: number;
  selected: boolean;
  performance_score?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================
// AI & MODEL TYPES
// ============================================================

export type ModelTier = "premium" | "standard" | "cheap";
export type TaskType = "creative" | "strategic" | "structural" | "formatting" | "refine";

export interface AIUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost?: number; // in cents
}

export interface AIMetadata {
  model: string;
  tier: ModelTier;
  task_type?: TaskType;
  mode?: OutputMode;
  temperature?: number;
  max_tokens?: number;
}

// ============================================================
// AGENTS
// ============================================================

export type AgentRole = "sales" | "support" | "service" | "creative" | "analyst";
export type AgentMode = "mock" | "live";
export type MessageRole = "user" | "assistant" | "system";

export const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export interface AgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface AgentResponse {
  answer: string;
  confidence: number; // 0-1
  sources?: string[];
  reasoning?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// CAMPAIGNS & SCHEDULING
// ============================================================

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  objective: string;
  status: Status;
  start_date: string;
  end_date?: string;
  channels: Platform[];
  metrics?: CampaignMetrics;
  created_at: string;
  updated_at?: string;
}

export interface CampaignMetrics {
  impressions: number;
  engagement: number;
  clicks: number;
  conversions: number;
  engagement_rate: number;
  conversion_rate: number;
}

export interface ScheduledPost {
  id: string;
  campaign_id?: string;
  user_id: string;
  platform: Platform;
  content: string;
  media_urls?: string[];
  scheduled_at: string;
  published_at?: string;
  status: "scheduled" | "publishing" | "published" | "failed";
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// ANALYTICS
// ============================================================

export interface AnalyticsEvent {
  id: string;
  app: App;
  event_type: string;
  user_id?: string;
  properties?: Record<string, any>;
  created_at: string;
}

export interface PerformanceMetrics {
  total_operations: number;
  success_rate: number; // percentage
  avg_response_time: number; // ms
  total_tokens: number;
  estimated_cost: number; // dollars
  period_start: string;
  period_end: string;
}

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

export const EmailContentSchema = z.object({
  subject: z.string().min(5).max(100),
  body: z.string().min(50).max(5000),
  tone: z.enum(["professional", "casual", "urgent"]).optional(),
  cta: z.string().optional(),
});

export const SocialPostSchema = z.object({
  hook: z.string().min(10).max(280),
  body: z.string().min(20).max(5000),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).max(10).optional(),
  platform: z.enum(["linkedin", "twitter", "instagram", "tiktok", "youtube"]),
});

export const CopySchema = z.object({
  headline: z.string().min(5).max(100),
  subhead: z.string().min(10).max(200).optional(),
  body: z.string().min(50).max(5000),
  cta: z.string().min(3).max(50),
  tone: z.enum(["premium", "bold", "subtle"]).optional(),
});

// ============================================================
// ERROR TYPES
// ============================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, metadata);
    this.name = "ValidationError";
  }
}

export class AIError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, "AI_ERROR", 500, metadata);
    this.name = "AIError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", metadata?: Record<string, any>) {
    super(message, "RATE_LIMIT", 429, metadata);
    this.name = "RateLimitError";
  }
}

// ============================================================
// RESPONSE WRAPPERS
// ============================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    request_id?: string;
    [key: string]: any;
  };
}

export function successResponse<T>(data: T, metadata?: Record<string, any>): APIResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

export function errorResponse(
  error: AppError | Error,
  metadata?: Record<string, any>
): APIResponse {
  const isAppError = error instanceof AppError;

  return {
    success: false,
    error: {
      code: isAppError ? error.code : "INTERNAL_ERROR",
      message: error.message,
      details: isAppError ? error.metadata : undefined,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}
