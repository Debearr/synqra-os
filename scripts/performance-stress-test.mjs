#!/usr/bin/env node
/**
 * PERFORMANCE STRESS TEST
 * Fortune-500 grade load testing for NØID Labs ecosystem
 * Tests: API endpoints, concurrency, token efficiency, memory
 */

const ENDPOINTS = [
  { url: "http://localhost:3000/api/health", method: "GET", name: "Health Check" },
  { url: "http://localhost:3000/api/status", method: "GET", name: "Status" },
];

const CONCURRENCY_LEVELS = [10, 50, 100];
const DURATION_MS = 5000;

console.log("🔥 PERFORMANCE STRESS TEST");
console.log("━".repeat(60));

const results = {
  endpoints: [],
  concurrency: [],
  memory: { start: 0, end: 0, delta: 0 },
};

/**
 * Measure memory usage
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024),
  };
}

/**
 * Test single endpoint
 */
async function testEndpoint(endpoint) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    
    const duration = Date.now() - startTime;
    const status = response.status;
    
    return {
      success: response.ok,
      status,
      duration,
      error: null,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      duration,
      error: error.message,
    };
  }
}

/**
 * Test concurrency
 */
async function testConcurrency(endpoint, concurrency) {
  console.log(`\n🔄 Testing ${endpoint.name} with ${concurrency} concurrent requests...`);
  
  const startTime = Date.now();
  const promises = Array.from({ length: concurrency }, () => testEndpoint(endpoint));
  
  const results = await Promise.allSettled(promises);
  const duration = Date.now() - startTime;
  
  const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const failed = concurrency - successful;
  
  const avgDuration = results
    .filter((r) => r.status === "fulfilled")
    .reduce((sum, r) => sum + r.value.duration, 0) / successful || 0;
  
  console.log(`   ✅ Success: ${successful}/${concurrency}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏱️  Avg Duration: ${Math.round(avgDuration)}ms`);
  console.log(`   ⏱️  Total Duration: ${duration}ms`);
  
  return {
    concurrency,
    successful,
    failed,
    avgDuration: Math.round(avgDuration),
    totalDuration: duration,
    throughput: Math.round((concurrency / duration) * 1000),
  };
}

/**
 * Main test runner
 */
async function runStressTest() {
  console.log("📊 Starting stress test...\n");
  
  results.memory.start = getMemoryUsage();
  console.log(`💾 Memory (Start): ${results.memory.start.heapUsed} MB heap used\n`);
  
  // Test each endpoint
  for (const endpoint of ENDPOINTS) {
    console.log(`\n━━━ Testing: ${endpoint.name} ━━━`);
    
    for (const concurrency of CONCURRENCY_LEVELS) {
      const result = await testConcurrency(endpoint, concurrency);
      results.concurrency.push({
        endpoint: endpoint.name,
        ...result,
      });
    }
  }
  
  results.memory.end = getMemoryUsage();
  results.memory.delta = results.memory.end.heapUsed - results.memory.start.heapUsed;
  
  console.log("\n\n━".repeat(60));
  console.log("📊 STRESS TEST COMPLETE");
  console.log("━".repeat(60));
  
  console.log(`\n💾 Memory (End): ${results.memory.end.heapUsed} MB heap used`);
  console.log(`💾 Memory Delta: ${results.memory.delta > 0 ? "+" : ""}${results.memory.delta} MB`);
  
  if (Math.abs(results.memory.delta) > 50) {
    console.warn("⚠️  High memory delta detected - possible memory leak");
  } else {
    console.log("✅ Memory usage stable");
  }
  
  console.log("\n📈 PERFORMANCE SUMMARY");
  console.log("━".repeat(60));
  
  const avgThroughput = results.concurrency.reduce((sum, r) => sum + r.throughput, 0) / results.concurrency.length;
  const totalRequests = results.concurrency.reduce((sum, r) => sum + r.concurrency, 0);
  const totalSuccess = results.concurrency.reduce((sum, r) => sum + r.successful, 0);
  const successRate = (totalSuccess / totalRequests) * 100;
  
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${totalSuccess} (${Math.round(successRate)}%)`);
  console.log(`Avg Throughput: ${Math.round(avgThroughput)} req/s`);
  
  if (successRate >= 95) {
    console.log("\n✅ PERFORMANCE: EXCELLENT");
  } else if (successRate >= 85) {
    console.log("\n✅ PERFORMANCE: GOOD");
  } else {
    console.log("\n⚠️  PERFORMANCE: NEEDS IMPROVEMENT");
  }
  
  console.log("\n✅ Stress test complete");
}

runStressTest().catch((error) => {
  console.error("💥 Stress test failed:", error);
  process.exit(1);
});
