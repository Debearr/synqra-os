import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * GET /api/health
 * Returns the current health status of the application
 */
export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/health
 * Lightweight health check (no body)
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
