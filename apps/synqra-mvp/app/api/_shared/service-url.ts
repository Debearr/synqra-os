import { NextRequest } from "next/server";

function toBaseUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function firstForwardedValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

export function resolveServiceBaseUrl(request: NextRequest): string {
  const fromEnv = [process.env.CLOUD_RUN_SERVICE_URL, process.env.NEXT_PUBLIC_APP_URL]
    .map((value) => toBaseUrl(value))
    .find((value): value is string => Boolean(value));

  if (fromEnv) {
    return fromEnv;
  }

  const forwardedHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
  if (forwardedHost) {
    const forwardedProto = firstForwardedValue(request.headers.get("x-forwarded-proto"));
    const protocol = forwardedProto === "http" ? "http" : "https";
    return `${protocol}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

