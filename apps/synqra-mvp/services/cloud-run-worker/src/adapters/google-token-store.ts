import { createDecipheriv } from "crypto";
import { getSupabaseClient } from "./supabase.js";

type StoredTokenRow = {
  user_id: string;
  refresh_token_encrypted: string;
};

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

function decryptToken(encrypted: string, key: string): string {
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

export async function listDecryptedRefreshTokens(): Promise<Array<{ userId: string; refreshToken: string }>> {
  const encryptionKey = process.env.GOOGLE_ENCRYPTION_KEY?.trim();
  if (!encryptionKey) {
    throw new Error("GOOGLE_ENCRYPTION_KEY is required");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("google_oauth_tokens")
    .select("user_id,refresh_token_encrypted")
    .eq("provider", "google");

  if (error) {
    throw new Error(`Failed to fetch Google refresh tokens: ${error.message}`);
  }

  const rows = (data || []) as StoredTokenRow[];
  return rows
    .map((row) => {
      try {
        return {
          userId: row.user_id,
          refreshToken: decryptToken(row.refresh_token_encrypted, encryptionKey),
        };
      } catch {
        return null;
      }
    })
    .filter((row): row is { userId: string; refreshToken: string } => Boolean(row?.userId && row.refreshToken));
}

