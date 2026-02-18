import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type TokenPayload = {
  email: string;
};

export function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

export function validateUnsubscribeToken(token: string): boolean {
  try {
    return typeof token === "string" && /^[a-f0-9]{64}$/i.test(token.trim());
  } catch {
    return false;
  }
}

export function createUnsubscribeToken(email: string, secret = getSecret()): string {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error("Email is required");
  }

  const payloadB64 = base64UrlEncode(JSON.stringify({ email: normalized }));
  const signature = signPayload(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export function decodeUnsubscribeToken(token: string, secret = getSecret()): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSignature = signPayload(payloadB64, secret);
  if (!timingSafeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payloadB64).toString("utf8")) as TokenPayload;
    return normalizeEmail(parsed.email);
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(email: string, baseUrl = process.env.UNSUBSCRIBE_BASE_URL || "https://YOUR_DOMAIN"): string {
  const token = createUnsubscribeToken(email);
  return `${baseUrl.replace(/\/+$/, "")}/ops/unsubscribe?t=${encodeURIComponent(token)}`;
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("hex");
}

function getSecret(): string {
  return process.env.UNSUBSCRIBE_TOKEN_SECRET || "";
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function timingSafeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
