#!/usr/bin/env node
/**
 * Synqra OS Health Validation Script
 * Validates all endpoints and generates health report
 * Generated: 2025-11-10
 */

import https from 'https';
import http from 'http';

const ENDPOINTS = [
  {
    name: 'Health Check',
    url: 'http://localhost:3004/api/health',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Agents List',
    url: 'http://localhost:3004/api/agents',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Sales Agent',
    url: 'http://localhost:3004/api/agents/sales',
    method: 'POST',
    body: { message: 'Test query' },
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Support Agent',
    url: 'http://localhost:3004/api/agents/support',
    method: 'POST',
    body: { message: 'Test query' },
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Service Agent',
    url: 'http://localhost:3004/api/agents/service',
    method: 'POST',
    body: { message: 'Test query' },
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Status Endpoint',
    url: 'http://localhost:3004/api/status',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  },
  {
    name: 'Ready Check',
    url: 'http://localhost:3004/api/ready',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  }
];

function makeRequest(config) {
  return new Promise((resolve) => {
    const url = new URL(config.url);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    const startTime = Date.now();

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          success: res.statusCode === config.expectedStatus,
          statusCode: res.statusCode,
          duration,
          data: data.substring(0, 500) // Limit data size
        });
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        statusCode: 0,
        duration,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: 0,
        duration: 10000,
        error: 'Request timeout'
      });
    });

    if (config.body) {
      req.write(JSON.stringify(config.body));
    }

    req.end();
  });
}

async function validateEndpoints() {
  console.log('🔍 Synqra OS Health Validation');
  console.log('================================');
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    totalTests: ENDPOINTS.length,
    passed: 0,
    failed: 0,
    criticalFailed: 0,
    tests: []
  };

  for (const endpoint of ENDPOINTS) {
    console.log(`Testing: ${endpoint.name}...`);
    
    const result = await makeRequest(endpoint);
    
    const testResult = {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      critical: endpoint.critical,
      success: result.success,
      statusCode: result.statusCode,
      duration: result.duration,
      error: result.error
    };

    if (result.success) {
      results.passed++;
      console.log(`   ✅ PASS (${result.duration}ms)`);
    } else {
      results.failed++;
      if (endpoint.critical) {
        results.criticalFailed++;
      }
      console.log(`   ❌ FAIL: ${result.error || `Status ${result.statusCode}`}`);
    }

    results.tests.push(testResult);
    console.log('');
  }

  // Summary
  console.log('📊 SUMMARY');
  console.log('──────────');
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Critical Failures: ${results.criticalFailed} 🚨`);
  console.log('');

  if (results.criticalFailed === 0 && results.passed === results.totalTests) {
    console.log('✅ ALL SYSTEMS OPERATIONAL');
    return 0;
  } else if (results.criticalFailed > 0) {
    console.log('🚨 CRITICAL FAILURES DETECTED');
    return 2;
  } else {
    console.log('⚠️  SOME TESTS FAILED (Non-critical)');
    return 1;
  }
}

validateEndpoints()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(3);
  });
