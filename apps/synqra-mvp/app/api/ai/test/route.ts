/**
 * ============================================================
 * AI SYSTEM STRESS TEST API
 * ============================================================
 * Test all providers, routing, guardrails, and fallback logic
 */

import { NextResponse } from 'next/server';
import { executeWithGuardrails } from '@/lib/ai/unified-router';
import { callModel } from '@/lib/ai/providers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for tests

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const testType = body.testType || 'quick';
    
    console.log(`🧪 Running ${testType} stress test...`);
    
    const results: any = {
      testType,
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
      },
    };
    
    const startTime = Date.now();
    
    // ============================================================
    // TEST 1: Simple Query (should use Llama/local)
    // ============================================================
    try {
      console.log('Test 1: Simple query routing');
      const test1Start = Date.now();
      
      const result1 = await executeWithGuardrails({
        type: 'generation',
        input: 'What is 2+2?',
        brand: 'synqra',
        maxBudget: 0.001,
      });
      
      results.tests.push({
        name: 'Simple Query',
        status: result1.quality > 0.5 ? 'PASSED' : 'FAILED',
        duration: Date.now() - test1Start,
        model: result1.model,
        quality: result1.quality,
        cost: result1.cost,
        output: result1.output.substring(0, 100),
      });
      
      if (result1.quality > 0.5) results.summary.passed++;
      else results.summary.failed++;
      
    } catch (error: any) {
      results.tests.push({
        name: 'Simple Query',
        status: 'FAILED',
        error: error.message,
      });
      results.summary.failed++;
    }
    
    results.summary.total++;
    
    // ============================================================
    // TEST 2: Complex Query (should use DeepSeek/Claude)
    // ============================================================
    if (testType === 'full') {
      try {
        console.log('Test 2: Complex query routing');
        const test2Start = Date.now();
        
        const result2 = await executeWithGuardrails({
          type: 'reasoning',
          input: 'Analyze the pros and cons of using microservices architecture for a SaaS product with 10,000 users. Consider scalability, cost, and maintenance.',
          brand: 'synqra',
          requiresReasoning: true,
          isClientFacing: true,
          maxBudget: 0.05,
        });
        
        results.tests.push({
          name: 'Complex Query',
          status: result2.quality > 0.7 ? 'PASSED' : 'FAILED',
          duration: Date.now() - test2Start,
          model: result2.model,
          quality: result2.quality,
          cost: result2.cost,
          output: result2.output.substring(0, 150),
        });
        
        if (result2.quality > 0.7) results.summary.passed++;
        else results.summary.failed++;
        
      } catch (error: any) {
        results.tests.push({
          name: 'Complex Query',
          status: 'FAILED',
          error: error.message,
        });
        results.summary.failed++;
      }
      
      results.summary.total++;
    }
    
    // ============================================================
    // TEST 3: Brand Alignment (Synqra)
    // ============================================================
    try {
      console.log('Test 3: Brand alignment check');
      const test3Start = Date.now();
      
      const result3 = await executeWithGuardrails({
        type: 'generation',
        input: 'Write a one-sentence tagline for Synqra, an AI-powered content automation platform.',
        brand: 'synqra',
        isClientFacing: true,
        guardrails: {
          enableBrandAlignment: true,
          minQualityScore: 0.75,
          maxRetries: 2,
          enableToxicityCheck: true,
          enableHallucinationGate: true,
        },
      });
      
      results.tests.push({
        name: 'Brand Alignment',
        status: result3.metadata.guardrailsPassed ? 'PASSED' : 'FAILED',
        duration: Date.now() - test3Start,
        quality: result3.quality,
        brandAligned: result3.metadata.guardrailsPassed,
        issues: result3.metadata.issues,
      });
      
      if (result3.metadata.guardrailsPassed) results.summary.passed++;
      else results.summary.failed++;
      
    } catch (error: any) {
      results.tests.push({
        name: 'Brand Alignment',
        status: 'FAILED',
        error: error.message,
      });
      results.summary.failed++;
    }
    
    results.summary.total++;
    
    // ============================================================
    // TEST 4: Fallback Logic
    // ============================================================
    if (testType === 'full') {
      try {
        console.log('Test 4: Fallback logic');
        const test4Start = Date.now();
        
        // Force a potential failure by using very low budget
        const result4 = await executeWithGuardrails({
          type: 'generation',
          input: 'Write a 500-word essay on quantum computing.',
          brand: 'synqra',
          maxBudget: 0.0001, // Intentionally low
          enableSelfHealing: true,
        });
        
        results.tests.push({
          name: 'Fallback Logic',
          status: result4.output.length > 0 ? 'PASSED' : 'FAILED',
          duration: Date.now() - test4Start,
          fallbacksUsed: result4.metadata.fallbacksUsed,
          attempts: result4.metadata.attempts,
        });
        
        if (result4.output.length > 0) results.summary.passed++;
        else results.summary.failed++;
        
      } catch (error: any) {
        results.tests.push({
          name: 'Fallback Logic',
          status: 'FAILED',
          error: error.message,
        });
        results.summary.failed++;
      }
      
      results.summary.total++;
    }
    
    // ============================================================
    // TEST 5: Cache Performance
    // ============================================================
    try {
      console.log('Test 5: Cache performance');
      const test5Start = Date.now();
      
      // First call (cache miss)
      const firstCall = await executeWithGuardrails({
        type: 'generation',
        input: 'What is the capital of France?',
        brand: 'synqra',
        cacheKey: 'test-cache-key',
      });
      
      const firstCallTime = Date.now() - test5Start;
      
      // Second call (should be cached)
      const secondCallStart = Date.now();
      const secondCall = await executeWithGuardrails({
        type: 'generation',
        input: 'What is the capital of France?',
        brand: 'synqra',
        cacheKey: 'test-cache-key',
      });
      
      const secondCallTime = Date.now() - secondCallStart;
      
      const cacheWorking = secondCallTime < firstCallTime / 2;
      
      results.tests.push({
        name: 'Cache Performance',
        status: cacheWorking ? 'PASSED' : 'WARNING',
        firstCallTime,
        secondCallTime,
        improvement: `${((1 - secondCallTime / firstCallTime) * 100).toFixed(1)}%`,
      });
      
      if (cacheWorking) results.summary.passed++;
      else results.summary.failed++;
      
    } catch (error: any) {
      results.tests.push({
        name: 'Cache Performance',
        status: 'FAILED',
        error: error.message,
      });
      results.summary.failed++;
    }
    
    results.summary.total++;
    
    // Calculate final summary
    results.summary.duration = Date.now() - startTime;
    results.summary.successRate = `${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`;
    results.summary.overallStatus = results.summary.passed === results.summary.total ? 'PASSED' : 
                                    results.summary.passed >= results.summary.total * 0.8 ? 'WARNING' : 'FAILED';
    
    console.log(`✅ Stress test complete: ${results.summary.successRate} passed`);
    
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error('❌ Stress test error:', error);
    
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
