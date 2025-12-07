/**
 * ============================================================
 * AI SYSTEM HEALTH CHECK API
 * ============================================================
 * Monitors all AI providers, model status, and system health
 */

import { NextResponse } from 'next/server';
import { checkSystemHealth, getUsageStats } from '@/lib/ai/unified-router';
import { checkProviderHealth, getProviderConfig } from '@/lib/ai/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🏥 AI Health Check requested');
    
    // Get system health
    const systemHealth = await checkSystemHealth();
    
    // Get usage stats
    const stats = getUsageStats();
    
    // Get provider config
    const providerConfig = getProviderConfig();
    
    // Calculate health score (0-100)
    const providersHealthy = Object.values(systemHealth.providers).filter(Boolean).length;
    const providersTotal = Object.keys(systemHealth.providers).length;
    const healthScore = (providersHealthy / providersTotal) * 100;
    
    // Determine overall status
    const status = systemHealth.status;
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 206 : 503;
    
    return NextResponse.json({
      status: status.toUpperCase(),
      healthScore: Math.round(healthScore),
      timestamp: new Date().toISOString(),
      
      providers: {
        anthropic: {
          healthy: systemHealth.providers.anthropic,
          configured: providerConfig.anthropic.configured,
          model: providerConfig.anthropic.model,
        },
        openai: {
          healthy: systemHealth.providers.openai,
          configured: providerConfig.openai.configured,
          model: providerConfig.openai.model,
        },
        deepseek: {
          healthy: systemHealth.providers.deepseek,
          configured: providerConfig.deepseek.configured,
          model: providerConfig.deepseek.model,
        },
        mistral: {
          healthy: systemHealth.providers.mistral,
          configured: providerConfig.mistral.configured,
          model: providerConfig.mistral.model,
        },
        pythonService: {
          healthy: systemHealth.providers.pythonService,
          configured: providerConfig.pythonService.configured,
          url: providerConfig.pythonService.url,
        },
      },
      
      usage: {
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        failedRequests: stats.failedRequests,
        successRate: stats.totalRequests > 0 
          ? `${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%`
          : 'N/A',
        averageQuality: `${(stats.averageQuality * 100).toFixed(1)}%`,
        totalCost: `$${stats.totalCost.toFixed(4)}`,
        averageCost: `$${stats.averageCost.toFixed(4)}`,
        modelDistribution: stats.modelDistribution,
        guardrailsTriggered: stats.guardrailsTriggered,
      },
      
      recommendations: systemHealth.recommendations,
      
      metadata: {
        environment: process.env.NODE_ENV,
        version: '1.0.0',
      },
    }, { status: statusCode });
    
  } catch (error: any) {
    console.error('❌ Health check error:', error);
    
    return NextResponse.json({
      status: 'ERROR',
      healthScore: 0,
      timestamp: new Date().toISOString(),
      error: error.message,
      recommendations: [
        '❌ Health check failed - system may be down',
        'Check logs for specific errors',
        'Verify API keys and environment variables',
      ],
    }, { status: 503 });
  }
}
