import { NextResponse } from 'next/server';

/**
 * ============================================================
 * HEALTH CHECK ENDPOINT
 * ============================================================
 * Simple health check for Railway and monitoring systems
 * Returns 200 OK if app is running, with environment status
 */

export async function GET() {
  const startTime = Date.now();
  
  // Check environment variables (non-blocking)
  const envStatus = {
    hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasSupabaseServiceKey: !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3004',
  };

  // Calculate response time
  const responseTime = Date.now() - startTime;

  return NextResponse.json({
    status: 'healthy',
    service: 'synqra-mvp',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    environment: envStatus,
    responseTime: `${responseTime}ms`,
    version: '1.0.0',
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

// Also support HEAD requests for quick health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
