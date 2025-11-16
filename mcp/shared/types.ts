/**
 * ============================================================
 * SHARED TYPES - MCP FLEET
 * ============================================================
 * Common types used across all MCP tools
 */

/**
 * Platform types
 */
export type Platform = 
  | "youtube" 
  | "instagram" 
  | "tiktok" 
  | "facebook" 
  | "twitter" 
  | "linkedin";

/**
 * Brand identifiers
 */
export type BrandId = "synqra" | "noid" | "aurafx" | "de-bear";

/**
 * Content types
 */
export type ContentType = "video" | "image" | "text" | "audio" | "document";

/**
 * MCP Response wrapper
 */
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    mcpTool: string;
    duration: number;
    cost?: number;
  };
}

/**
 * Health check response
 */
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    name: string;
    status: "ok" | "warning" | "error";
    message?: string;
  }[];
}

/**
 * Environment configuration
 */
export interface EnvConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  supabaseAnonKey: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  deepseekApiKey?: string;
  telegramBotToken?: string;
  telegramChannelId?: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Logging levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  mcpTool: string;
  metadata?: Record<string, any>;
}

/**
 * Thumbnail specification
 */
export interface ThumbnailSpec {
  platform: Platform;
  width: number;
  height: number;
  aspectRatio: string;
  maxFileSize: number;
  format: string[];
}

/**
 * Content metadata
 */
export interface ContentMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  language?: string;
  publishDate?: string;
  platform?: Platform;
  brand?: BrandId;
}

/**
 * Analytics data
 */
export interface AnalyticsData {
  platform: Platform;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  timestamp: string;
}

/**
 * Quality validation result
 */
export interface QualityCheck {
  passed: boolean;
  score: number;
  issues: string[];
  suggestions?: string[];
}
