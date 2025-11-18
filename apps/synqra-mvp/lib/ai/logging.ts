/**
 * ============================================================
 * MODEL USAGE LOGGING
 * ============================================================
 * Logs all AI model usage to Supabase for cost tracking
 */

import { ModelUsageLog, ModelProvider } from './types';
import { createClient } from '@supabase/supabase-js';

/**
 * SUPABASE CLIENT
 * Initialize with environment variables
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * LOG MODEL USAGE
 * Stores usage data in Supabase
 */
export async function logModelUsage(log: ModelUsageLog): Promise<void> {
  const timestamp = log.timestamp || Date.now();
  
  // Console log for development
  console.log(`📊 Model Usage: ${log.model} | Tokens: ${log.inputTokens + log.outputTokens} | Cost: $${log.actualCost.toFixed(4)} | Cache: ${log.cacheHit}`);
  
  // Store in Supabase if available
  if (supabase) {
    try {
      const { error } = await supabase
        .from('ai_model_usage')
        .insert({
          task_id: log.taskId,
          model: log.model,
          input_tokens: log.inputTokens,
          output_tokens: log.outputTokens,
          estimated_cost: log.estimatedCost,
          actual_cost: log.actualCost,
          complexity: log.complexity,
          cache_hit: log.cacheHit,
          created_at: new Date(timestamp).toISOString(),
        } as any);
      
      if (error) {
        console.error('❌ Failed to log model usage to Supabase:', error);
      }
    } catch (err) {
      console.error('❌ Supabase logging error:', err);
    }
  }
  
  // Also store in local log file for backup
  await logToFile(log);
}

/**
 * LOG TO FILE
 * Backup logging to local file
 */
async function logToFile(log: ModelUsageLog): Promise<void> {
  // In serverless environments, we can't write to file system
  // Instead, we'll use console.log which Railway/Vercel captures
  const logLine = JSON.stringify({
    timestamp: new Date(log.timestamp || Date.now()).toISOString(),
    ...log,
  });
  
  console.log(`[AI-USAGE] ${logLine}`);
}

/**
 * GET USAGE STATS
 * Retrieves usage statistics from Supabase
 */
export async function getUsageStats(options: {
  startDate?: Date;
  endDate?: Date;
  model?: ModelProvider;
}): Promise<{
  totalCost: number;
  totalTasks: number;
  byModel: Record<ModelProvider, { count: number; cost: number }>;
  cacheHitRate: number;
}> {
  if (!supabase) {
    console.warn('⚠️  Supabase not initialized, returning empty stats');
    return {
      totalCost: 0,
      totalTasks: 0,
      byModel: {} as any,
      cacheHitRate: 0,
    };
  }
  
  try {
    let query = supabase
      .from('ai_model_usage')
      .select('*');
    
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }
    
    if (options.model) {
      query = query.eq('model', options.model);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Failed to fetch usage stats:', error);
      return {
        totalCost: 0,
        totalTasks: 0,
        byModel: {} as any,
        cacheHitRate: 0,
      };
    }
    
    // Calculate statistics
    const totalCost = (data as any[]).reduce((sum, log) => sum + (log.actual_cost || 0), 0);
    const totalTasks = data.length;
    const cacheHits = (data as any[]).filter(log => log.cache_hit).length;
    const cacheHitRate = totalTasks > 0 ? cacheHits / totalTasks : 0;
    
    // Group by model
    const byModel: Record<string, { count: number; cost: number }> = {};
    for (const log of (data as any[])) {
      const model = log.model;
      if (!byModel[model]) {
        byModel[model] = { count: 0, cost: 0 };
      }
      byModel[model].count++;
      byModel[model].cost += log.actual_cost || 0;
    }
    
    return {
      totalCost,
      totalTasks,
      byModel: byModel as Record<ModelProvider, { count: number; cost: number }>,
      cacheHitRate,
    };
  } catch (err) {
    console.error('❌ Error fetching usage stats:', err);
    return {
      totalCost: 0,
      totalTasks: 0,
      byModel: {} as any,
      cacheHitRate: 0,
    };
  }
}

/**
 * GENERATE COST REPORT
 */
export async function generateCostReport(days: number = 30): Promise<string> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await getUsageStats({ startDate, endDate });
  
  const report = `
=== AI COST REPORT (Last ${days} Days) ===

Total Cost: $${stats.totalCost.toFixed(2)}
Total Tasks: ${stats.totalTasks}
Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%

Breakdown by Model:
${Object.entries(stats.byModel).map(([model, data]) => 
  `  ${model}: ${data.count} tasks, $${data.cost.toFixed(2)}`
).join('\n')}

Projected Monthly Cost: $${(stats.totalCost / days * 30).toFixed(2)}
  `.trim();
  
  return report;
}

/**
 * SETUP SUPABASE TABLE
 * SQL to create the ai_model_usage table
 */
export const SUPABASE_TABLE_SQL = `
-- AI Model Usage Logging Table
CREATE TABLE IF NOT EXISTS ai_model_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  estimated_cost DECIMAL(10, 6) NOT NULL,
  actual_cost DECIMAL(10, 6) NOT NULL,
  complexity DECIMAL(3, 2) NOT NULL,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_created_at ON ai_model_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_model ON ai_model_usage(model);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_task_id ON ai_model_usage(task_id);

-- Enable Row Level Security (RLS)
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to insert
CREATE POLICY IF NOT EXISTS "Allow service role to insert" ON ai_model_usage
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Allow service role to select
CREATE POLICY IF NOT EXISTS "Allow service role to select" ON ai_model_usage
  FOR SELECT
  TO service_role
  USING (true);
`;
