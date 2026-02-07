import { NextRequest, NextResponse } from "next/server";

/**
 * ============================================================
 * IDENTITY INITIALIZATION ENDPOINT
 * ============================================================
 * POST /api/identity/init
 * Fast identity initialization without AI dependency
 * Sets identity cookie and returns success immediately
 */

const IDENTITY_COOKIE = "synqra_identity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityCode = body.identityCode;

    // Validate input
    if (!identityCode || typeof identityCode !== "string") {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "The 'identityCode' field is required and must be a string",
        },
        { status: 400 }
      );
    }

    const trimmedCode = identityCode.trim();
    if (trimmedCode.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Identity code cannot be empty",
        },
        { status: 400 }
      );
    }

    // Set identity cookie
    const response = NextResponse.json({
      success: true,
      message: "Identity initialized",
      identityCode: trimmedCode,
    });

    response.cookies.set(IDENTITY_COOKIE, trimmedCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Identity initialization error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize identity",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

