import { createHash, randomInt } from "crypto";

const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_CODE_LENGTH = 10;
const DEFAULT_TTL_HOURS = 24 * 7;

export type AccessCodeRole = "user" | "admin";

function parsePositiveInteger(raw: string | undefined, fallbackValue: number): number {
  if (!raw) return fallbackValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

export function getAccessCodeTtlHours(): number {
  return parsePositiveInteger(process.env.ACCESS_CODE_TTL_HOURS, DEFAULT_TTL_HOURS);
}

export function calculateAccessCodeExpiry(): string {
  const ttlHours = getAccessCodeTtlHours();
  return new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
}

export function generateAccessCode(length = DEFAULT_CODE_LENGTH): string {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    const next = ACCESS_CODE_ALPHABET[randomInt(0, ACCESS_CODE_ALPHABET.length)];
    code += next;
  }
  return code;
}

export function hashAccessCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function maskAccessCode(code: string): string {
  if (code.length <= 4) {
    return "****";
  }
  return `${code.slice(0, 2)}****${code.slice(-2)}`;
}
