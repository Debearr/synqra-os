/**
 * ============================================================
 * AI USAGE STATISTICS API
 * ============================================================
 * Detailed usage stats for monitoring and optimization
 */

import { NextResponse } from 'next/server';
import { getUsageStats, resetUsageStats } from '@/lib/ai/unified-router';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = getUsageStats();
    
    // Calculate additional metrics
    const successRate = stats.totalRequests > 0
      ? (stats.successfulRequests / stats.totalRequests) * 100
      : 0;
    
    const failureRate = stats.totalRequests > 0
      ? (stats.failedRequests / stats.totalRequests) * 100
      : 0;
    
    const guardrailRate = stats.totalRequests > 0
      ? (stats.guardrailsTriggered / stats.totalRequests) * 100
      : 0;
    
    // Model distribution percentages
    const modelPercentages: Record<string, string> = {};
    if (stats.totalRequests > 0) {
      Object.entries(stats.modelDistribution).forEach(([model, count]) => {
        modelPercentages[model] = `${((count / stats.totalRequests) * 100).toFixed(1)}%`;
      });
    }
    
    return NextResponse.json({
      summary: {
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        failedRequests: stats.failedRequests,
        successRate: `${successRate.toFixed(1)}%`,
        failureRate: `${failureRate.toFixed(1)}%`,
      },
      
      quality: {
        averageQuality: `${(stats.averageQuality * 100).toFixed(1)}%`,
        guardrailsTriggered: stats.guardrailsTriggered,
        guardrailRate: `${guardrailRate.toFixed(1)}%`,
      },
      
      costs: {
        totalCost: `$${stats.totalCost.toFixed(4)}`,
        averageCost: `$${stats.averageCost.toFixed(6)}`,
        projectedMonthlyCost: `$${(stats.averageCost * 10000).toFixed(2)}`, // Assuming 10k requests/month
      },
      
      models: {
        distribution: stats.modelDistribution,
        percentages: modelPercentages,
      },
      
      insights: generateInsights(stats, successRate, guardrailRate),
      
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    resetUsageStats();
    
    return NextResponse.json({
      message: 'Usage statistics reset successfully',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}

function generateInsights(
  stats: any,
  successRate: number,
  guardrailRate: number
): string[] {
  const insights: string[] = [];
  
  if (stats.totalRequests === 0) {
    insights.push('No requests processed yet');
    return insights;
  }
  
  // Success rate insights
  if (successRate >= 95) {
    insights.push('✅ Excellent success rate - system performing optimally');
  } else if (successRate >= 80) {
    insights.push('✅ Good success rate - system performing well');
  } else if (successRate >= 60) {
    insights.push('⚠️  Success rate below target - investigate failures');
  } else {
    insights.push('❌ Poor success rate - immediate attention required');
  }
  
  // Cost insights
  if (stats.averageCost < 0.005) {
    insights.push('💰 Cost-optimized routing working well');
  } else if (stats.averageCost < 0.01) {
    insights.push('💰 Cost within acceptable range');
  } else {
    insights.push('💰 High average cost - review routing logic');
  }
  
  // Quality insights
  if (stats.averageQuality >= 0.8) {
    insights.push('🎯 High quality outputs maintained');
  } else if (stats.averageQuality >= 0.7) {
    insights.push('🎯 Quality within acceptable range');
  } else {
    insights.push('⚠️  Quality below target - review guardrails');
  }
  
  // Guardrail insights
  if (guardrailRate > 30) {
    insights.push('🚨 High guardrail trigger rate - review content guidelines');
  } else if (guardrailRate > 10) {
    insights.push('⚠️  Moderate guardrail triggers - monitor quality');
  } else {
    insights.push('✅ Low guardrail triggers - content quality good');
  }
  
  // Model distribution insights
  const localModels = ['llama-3.2-1b', 'optimized'];
  const localRequests = Object.entries(stats.modelDistribution)
    .filter(([model]) => localModels.includes(model))
    .reduce((sum, [, count]) => sum + count, 0);
  
  const localPercentage = (localRequests / stats.totalRequests) * 100;
  
  if (localPercentage >= 80) {
    insights.push('🎯 Target achieved: 80%+ local processing');
  } else if (localPercentage >= 60) {
    insights.push('📊 Good local processing rate - continue optimizing');
  } else {
    insights.push('📊 Low local processing - increase local model usage');
  }
  
  return insights;
}
