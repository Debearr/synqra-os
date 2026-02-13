import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

const ADMIN_TOKEN_QUERY_PARAM = "adminToken";
const ADMIN_TOKEN_HEADER = "x-admin-token";
const ADMIN_TOKEN_COOKIE = "synqra_admin_token";

type TokenSource = "body" | "query" | "header" | "cookie";

type AdminAccessSuccess = {
  ok: true;
  source: TokenSource;
};

type AdminAccessFailure = {
  ok: false;
  status: number;
  error: string;
};

export type AdminAccessResult = AdminAccessSuccess | AdminAccessFailure;

type VerifyAdminAccessOptions = {
  bodyToken?: string | null;
};

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getConfiguredAdminToken(): string | null {
  return normalizeToken(process.env.ADMIN_TOKEN);
}

function constantTimeTokenCompare(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function verifyAdminAccess(request: NextRequest, options: VerifyAdminAccessOptions = {}): AdminAccessResult {
  const expectedToken = getConfiguredAdminToken();
  if (!expectedToken) {
    return {
      ok: false,
      status: 503,
      error: "ADMIN_TOKEN is not configured",
    };
  }

  const candidates: Array<{ source: TokenSource; value: string | null }> = [
    { source: "body", value: normalizeToken(options.bodyToken) },
    { source: "query", value: normalizeToken(request.nextUrl.searchParams.get(ADMIN_TOKEN_QUERY_PARAM)) },
    { source: "header", value: normalizeToken(request.headers.get(ADMIN_TOKEN_HEADER)) },
    { source: "cookie", value: normalizeToken(request.cookies.get(ADMIN_TOKEN_COOKIE)?.value) },
  ];

  const presentedToken = candidates.find((candidate) => candidate.value);
  if (!presentedToken?.value) {
    return {
      ok: false,
      status: 401,
      error: "Admin token required",
    };
  }

  if (!constantTimeTokenCompare(presentedToken.value, expectedToken)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized - invalid admin token",
    };
  }

  return {
    ok: true,
    source: presentedToken.source,
  };
}

