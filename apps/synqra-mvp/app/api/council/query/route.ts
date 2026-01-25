import { NextResponse } from "next/server";
import { queryCouncil } from "@/lib/council/council";
import { getSessionUser } from "@/lib/auth/session";
import { buildErrorResponse } from "@/lib/errors/responses";
import { ERROR_CODES } from "@/lib/errors/codes";
import { councilConfig } from "@/lib/council/config";
import { countRecentSessions } from "@/lib/council/logger";

export async function POST(req: Request) {
  const { user, token } = await getSessionUser(req);

  if (!user || !token) {
    return NextResponse.json(
      buildErrorResponse({
        code: ERROR_CODES.UNAUTHORIZED,
        message: "Authentication required.",
        status: 401,
      }),
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.query !== "string" || body.query.trim() === "") {
    return NextResponse.json(
      buildErrorResponse({
        code: ERROR_CODES.BAD_REQUEST,
        message: "Query is required.",
        status: 400,
      }),
      { status: 400 }
    );
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const count = await countRecentSessions({
    token,
    userId: user.id,
    sinceIso: since,
  });

  if (count >= councilConfig.rateLimitPerHour) {
    return NextResponse.json(
      buildErrorResponse({
        code: ERROR_CODES.RATE_LIMITED,
        message: "Council rate limit exceeded.",
        status: 429,
      }),
      { status: 429 }
    );
  }

  const context = typeof body.context === "object" && body.context ? body.context : {};
  const result = await queryCouncil(body.query, {
    ...context,
    userId: user.id,
    authToken: token,
  });

  const status = result.success
    ? 200
    : result.error?.code === "timeout"
      ? 504
      : result.error?.code === "groq_failed"
        ? 502
        : result.error?.code === "unauthorized"
          ? 401
          : 500;

  return NextResponse.json(result, { status });
}
