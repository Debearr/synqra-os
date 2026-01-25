import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_PROVIDER = "google";

function getEncryptionKeyFromEnv(): string {
  const key = process.env.GOOGLE_ENCRYPTION_KEY?.trim();
  if (!key) {
    throw new Error("GOOGLE_ENCRYPTION_KEY is required");
  }
  return key;
}

function normalizeEncryptionKey(key: string): Buffer {
  const base64Candidate = key.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64Candidate + "=".repeat((4 - (base64Candidate.length % 4)) % 4);
  const base64Buffer = Buffer.from(padded, "base64");
  if (base64Buffer.length === 32) {
    return base64Buffer;
  }

  const utf8Buffer = Buffer.from(key, "utf8");
  if (utf8Buffer.length !== 32) {
    throw new Error("GOOGLE_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return utf8Buffer;
}

export function encryptToken(token: string, key: string): string {
  if (!token || !token.trim()) {
    throw new Error("Token cannot be empty");
  }

  const keyBuffer = normalizeEncryptionKey(key);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptToken(encrypted: string, key: string): string {
  const [ivPart, authTagPart, cipherPart] = encrypted.split(".");
  if (!ivPart || !authTagPart || !cipherPart) {
    throw new Error("Encrypted token format is invalid");
  }

  const keyBuffer = normalizeEncryptionKey(key);
  const decipher = createDecipheriv("aes-256-gcm", keyBuffer, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherPart, "base64url")), decipher.final()]);
  return decrypted.toString("utf8");
}

export async function storeRefreshToken(userId: string, encryptedToken: string): Promise<void> {
  if (!userId) {
    throw new Error("userId is required");
  }
  if (!encryptedToken) {
    throw new Error("encryptedToken is required");
  }

  const supabase = requireSupabaseAdmin();
  const { error } = await supabase.from("google_oauth_tokens").upsert(
    {
      user_id: userId,
      provider: DEFAULT_PROVIDER,
      refresh_token_encrypted: encryptedToken,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,provider",
    }
  );

  if (error) {
    throw new Error(`Failed to store refresh token: ${error.message}`);
  }
}

export async function getRefreshToken(userId: string): Promise<string | null> {
  if (!userId) {
    throw new Error("userId is required");
  }

  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("google_oauth_tokens")
    .select("refresh_token_encrypted")
    .eq("user_id", userId)
    .eq("provider", DEFAULT_PROVIDER)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get refresh token: ${error.message}`);
  }

  if (!data?.refresh_token_encrypted) {
    return null;
  }

  return decryptToken(data.refresh_token_encrypted, getEncryptionKeyFromEnv());
}

