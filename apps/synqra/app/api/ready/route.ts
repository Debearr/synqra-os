import { NextResponse } from "next/server";

/**
 * ============================================================
 * READINESS CHECK ENDPOINT
 * ============================================================
 * Used by orchestrators to determine if the app is ready to serve traffic
 */

async function performReadinessCheck() {
  try {
    const response = {
      status: "ok",
      ready: true,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Readiness check failed:", error);

    return NextResponse.json(
      {
        status: "not ready",
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}

export async function GET() {
  return performReadinessCheck();
}

export async function HEAD() {
  const response = await performReadinessCheck();
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
