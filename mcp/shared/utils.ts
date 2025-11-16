/**
 * ============================================================
 * SHARED UTILITIES - MCP FLEET
 * ============================================================
 * Common utility functions
 */

import { MCPResponse, RetryConfig, LogEntry, LogLevel } from './types';
import { DEFAULT_RETRY_CONFIG } from './config';

/**
 * Wrap response in MCP format
 */
export function wrapResponse<T>(
  data: T,
  mcpTool: string,
  startTime: number = Date.now()
): MCPResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      mcpTool,
      duration: Date.now() - startTime,
    },
  };
}

/**
 * Wrap error in MCP format
 */
export function wrapError(
  error: string | Error,
  mcpTool: string,
  startTime: number = Date.now()
): MCPResponse {
  return {
    success: false,
    error: error instanceof Error ? error.message : error,
    metadata: {
      timestamp: new Date().toISOString(),
      mcpTool,
      duration: Date.now() - startTime,
    },
  };
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  let delay = retryConfig.initialDelay;
  
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retryConfig.maxAttempts) {
        break;
      }
      
      console.log(`Retry attempt ${attempt}/${retryConfig.maxAttempts} failed, waiting ${delay}ms...`);
      
      await sleep(delay);
      delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay);
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logger
 */
export class Logger {
  private mcpTool: string;
  
  constructor(mcpTool: string) {
    this.mcpTool = mcpTool;
  }
  
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      mcpTool: this.mcpTool,
      metadata,
    };
    
    const emoji = {
      debug: '🔍',
      info: 'ℹ️ ',
      warn: '⚠️ ',
      error: '❌',
    }[level];
    
    console.log(`${emoji} [${this.mcpTool}] ${message}`, metadata || '');
  }
  
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }
  
  error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }
}

/**
 * Validate required fields
 */
export function validateRequired(
  obj: Record<string, any>,
  fields: string[]
): void {
  const missing = fields.filter(field => !obj[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Sanitize string
 */
export function sanitize(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .trim();
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Truncate string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  return { result, duration };
}
