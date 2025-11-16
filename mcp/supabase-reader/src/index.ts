/**
 * ============================================================
 * SUPABASE READER MCP
 * ============================================================
 * Vector search, analytics, and query operations
 */

import { loadEnvConfig } from '../../shared/config';
import { MCPResponse } from '../../shared/types';
import { wrapResponse, wrapError, Logger, validateRequired } from '../../shared/utils';
import { createClient } from '@supabase/supabase-js';

const logger = new Logger('supabase-reader');

export interface QueryRequest {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  limit?: number;
  orderBy?: { column: string; ascending?: boolean };
}

export interface VectorSearchRequest {
  table: string;
  embedding: number[];
  matchThreshold?: number;
  matchCount?: number;
}

export class SupabaseReader {
  private supabase: any;
  
  constructor() {
    const config = loadEnvConfig(['supabase-url', 'supabase-service-key']);
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }
  
  /**
   * Query records
   */
  async query(request: QueryRequest): Promise<MCPResponse<any[]>> {
    const startTime = Date.now();
    
    try {
      logger.info('Querying records', { table: request.table });
      
      validateRequired(request, ['table']);
      
      let query = this.supabase
        .from(request.table)
        .select(request.select || '*');
      
      // Apply filters
      if (request.filters) {
        Object.entries(request.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Apply ordering
      if (request.orderBy) {
        query = query.order(request.orderBy.column, {
          ascending: request.orderBy.ascending !== false,
        });
      }
      
      // Apply limit
      if (request.limit) {
        query = query.limit(request.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      logger.info('Query complete', { count: data?.length || 0 });
      
      return wrapResponse(data || [], 'supabase-reader', startTime);
    } catch (error) {
      logger.error('Query failed', { error });
      return wrapError(error as Error, 'supabase-reader', startTime);
    }
  }
  
  /**
   * Get single record by ID
   */
  async getById(table: string, id: string): Promise<MCPResponse<any>> {
    const startTime = Date.now();
    
    try {
      logger.info('Getting record by ID', { table, id });
      
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      logger.info('Record retrieved');
      
      return wrapResponse(data, 'supabase-reader', startTime);
    } catch (error) {
      logger.error('Get by ID failed', { error });
      return wrapError(error as Error, 'supabase-reader', startTime);
    }
  }
  
  /**
   * Vector search
   */
  async vectorSearch(request: VectorSearchRequest): Promise<MCPResponse<any[]>> {
    const startTime = Date.now();
    
    try {
      logger.info('Vector search', { table: request.table });
      
      validateRequired(request, ['table', 'embedding']);
      
      const matchThreshold = request.matchThreshold || 0.7;
      const matchCount = request.matchCount || 5;
      
      // Call Supabase vector search function
      const { data, error } = await this.supabase.rpc('match_documents', {
        query_embedding: request.embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });
      
      if (error) throw error;
      
      logger.info('Vector search complete', { results: data?.length || 0 });
      
      return wrapResponse(data || [], 'supabase-reader', startTime);
    } catch (error) {
      logger.error('Vector search failed', { error });
      return wrapError(error as Error, 'supabase-reader', startTime);
    }
  }
  
  /**
   * Get analytics
   */
  async getAnalytics(table: string, filters?: Record<string, any>): Promise<MCPResponse<any>> {
    const startTime = Date.now();
    
    try {
      logger.info('Getting analytics', { table });
      
      let query = this.supabase
        .from(table)
        .select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate basic analytics
      const analytics = {
        totalRecords: data?.length || 0,
        dateRange: data && data.length > 0 ? {
          earliest: data[0].created_at,
          latest: data[data.length - 1].created_at,
        } : null,
        data: data || [],
      };
      
      logger.info('Analytics retrieved', { total: analytics.totalRecords });
      
      return wrapResponse(analytics, 'supabase-reader', startTime);
    } catch (error) {
      logger.error('Get analytics failed', { error });
      return wrapError(error as Error, 'supabase-reader', startTime);
    }
  }
  
  /**
   * Query logs
   */
  async queryLogs(filters?: { level?: string; mcpTool?: string; since?: string }): Promise<MCPResponse<any[]>> {
    const startTime = Date.now();
    
    try {
      logger.info('Querying logs', { filters });
      
      let query = this.supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      
      if (filters?.mcpTool) {
        query = query.eq('mcp_tool', filters.mcpTool);
      }
      
      if (filters?.since) {
        query = query.gte('timestamp', filters.since);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      logger.info('Logs retrieved', { count: data?.length || 0 });
      
      return wrapResponse(data || [], 'supabase-reader', startTime);
    } catch (error) {
      logger.error('Query logs failed', { error });
      return wrapError(error as Error, 'supabase-reader', startTime);
    }
  }
}

export const supabaseReader = new SupabaseReader();

if (require.main === module) {
  supabaseReader.query({
    table: 'test_table',
    limit: 10,
  }).then(response => console.log(JSON.stringify(response, null, 2)));
}
