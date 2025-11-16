/**
 * ============================================================
 * SUPABASE WRITER MCP
 * ============================================================
 * CRUD operations for Supabase database
 */

import { loadEnvConfig } from '../../shared/config';
import { MCPResponse } from '../../shared/types';
import { wrapResponse, wrapError, Logger, validateRequired } from '../../shared/utils';
import { createClient } from '@supabase/supabase-js';

const logger = new Logger('supabase-writer');

export interface InsertRequest {
  table: string;
  data: Record<string, any> | Record<string, any>[];
}

export interface UpdateRequest {
  table: string;
  id: string;
  data: Record<string, any>;
}

export interface DeleteRequest {
  table: string;
  id: string;
}

export class SupabaseWriter {
  private supabase: any;
  
  constructor() {
    const config = loadEnvConfig(['supabase-url', 'supabase-service-key']);
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }
  
  /**
   * Insert record(s)
   */
  async insert(request: InsertRequest): Promise<MCPResponse<any>> {
    const startTime = Date.now();
    
    try {
      logger.info('Inserting records', { table: request.table });
      
      validateRequired(request, ['table', 'data']);
      
      const { data, error } = await this.supabase
        .from(request.table)
        .insert(request.data)
        .select();
      
      if (error) throw error;
      
      logger.info('Records inserted', { count: Array.isArray(data) ? data.length : 1 });
      
      return wrapResponse(data, 'supabase-writer', startTime);
    } catch (error) {
      logger.error('Insert failed', { error });
      return wrapError(error as Error, 'supabase-writer', startTime);
    }
  }
  
  /**
   * Update record
   */
  async update(request: UpdateRequest): Promise<MCPResponse<any>> {
    const startTime = Date.now();
    
    try {
      logger.info('Updating record', { table: request.table, id: request.id });
      
      validateRequired(request, ['table', 'id', 'data']);
      
      const { data, error } = await this.supabase
        .from(request.table)
        .update(request.data)
        .eq('id', request.id)
        .select();
      
      if (error) throw error;
      
      logger.info('Record updated');
      
      return wrapResponse(data, 'supabase-writer', startTime);
    } catch (error) {
      logger.error('Update failed', { error });
      return wrapError(error as Error, 'supabase-writer', startTime);
    }
  }
  
  /**
   * Delete record
   */
  async delete(request: DeleteRequest): Promise<MCPResponse<{ deleted: boolean }>> {
    const startTime = Date.now();
    
    try {
      logger.info('Deleting record', { table: request.table, id: request.id });
      
      validateRequired(request, ['table', 'id']);
      
      const { error } = await this.supabase
        .from(request.table)
        .delete()
        .eq('id', request.id);
      
      if (error) throw error;
      
      logger.info('Record deleted');
      
      return wrapResponse({ deleted: true }, 'supabase-writer', startTime);
    } catch (error) {
      logger.error('Delete failed', { error });
      return wrapError(error as Error, 'supabase-writer', startTime);
    }
  }
  
  /**
   * Batch insert
   */
  async batchInsert(table: string, records: Record<string, any>[]): Promise<MCPResponse<any>> {
    const startTime = Date.now();
    
    try {
      logger.info('Batch inserting', { table, count: records.length });
      
      // Split into chunks of 1000 (Supabase limit)
      const chunkSize = 1000;
      const chunks = [];
      
      for (let i = 0; i < records.length; i += chunkSize) {
        chunks.push(records.slice(i, i + chunkSize));
      }
      
      const results = [];
      
      for (const chunk of chunks) {
        const { data, error } = await this.supabase
          .from(table)
          .insert(chunk)
          .select();
        
        if (error) throw error;
        results.push(...(data || []));
      }
      
      logger.info('Batch insert complete', { inserted: results.length });
      
      return wrapResponse(results, 'supabase-writer', startTime);
    } catch (error) {
      logger.error('Batch insert failed', { error });
      return wrapError(error as Error, 'supabase-writer', startTime);
    }
  }
  
  /**
   * Upsert (insert or update if exists)
   */
  async upsert(request: InsertRequest & { conflictColumns?: string[] }): Promise<MCPResponse<any>> {
    const startTime = Date.now();
    
    try {
      logger.info('Upserting records', { table: request.table });
      
      const { data, error } = await this.supabase
        .from(request.table)
        .upsert(request.data, {
          onConflict: request.conflictColumns?.join(','),
        })
        .select();
      
      if (error) throw error;
      
      logger.info('Upsert complete');
      
      return wrapResponse(data, 'supabase-writer', startTime);
    } catch (error) {
      logger.error('Upsert failed', { error });
      return wrapError(error as Error, 'supabase-writer', startTime);
    }
  }
}

export const supabaseWriter = new SupabaseWriter();

if (require.main === module) {
  supabaseWriter.insert({
    table: 'test_table',
    data: { name: 'Test', value: 123 },
  }).then(response => console.log(JSON.stringify(response, null, 2)));
}
