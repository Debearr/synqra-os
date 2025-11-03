import { NextResponse } from 'next/server';

/**
 * Health check endpoint for deployment validation
 * Returns 200 OK if the application is running properly
 */
export async function GET() {
  try {
    // Basic health check - you can add more checks here
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        server: 'ok',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    // If something goes wrong, return 503 Service Unavailable
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD request support for lightweight health checks
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
