import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { TokenVaultEnvelope } from "@/lib/brokers/types";

const ENCRYPTION_ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getVaultKey(): Buffer {
  const raw = process.env.BROKER_TOKEN_VAULT_KEY;
  if (!raw) {
    throw new Error("BROKER_TOKEN_VAULT_KEY is required for token encryption");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("BROKER_TOKEN_VAULT_KEY must be 32 bytes (base64 encoded)");
  }
  return key;
}

function getKeyId(key: Buffer): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 12);
}

// Regulatory safety: never persist raw broker tokens.
export function encryptToken(token: string): { envelope: TokenVaultEnvelope; fingerprint: string } {
  const key = getVaultKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    envelope: {
      ciphertext: ciphertext.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      keyId: getKeyId(key),
    },
    fingerprint: createHash("sha256").update(token).digest("hex"),
  };
}

// Decrypt is allowed only for read-only data access flows.
export function decryptToken(envelope: TokenVaultEnvelope): string {
  const key = getVaultKey();
  if (envelope.keyId !== getKeyId(key)) {
    throw new Error("Token vault key mismatch");
  }
  const decipher = createDecipheriv(
    ENCRYPTION_ALGO,
    key,
    Buffer.from(envelope.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
