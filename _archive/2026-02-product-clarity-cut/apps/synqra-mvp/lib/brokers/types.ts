export type BrokerProvider = "oanda";

// Explicitly read-only scopes to prevent execution access.
export type BrokerScope = "read:accounts" | "read:positions" | "read:prices" | "read:orders";

export interface BrokerPermissions {
  provider: BrokerProvider;
  scopes: BrokerScope[];
  mode: "read-only";
  // Compliance disclosure for UI display.
  restrictedActions: string[];
}

export interface TokenVaultEnvelope {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
}

export interface TokenVaultRecord {
  id: string;
  provider: BrokerProvider;
  tokenFingerprint: string;
  envelope: TokenVaultEnvelope;
  createdAt: string;
}

export interface TokenVaultStorage {
  saveToken(record: TokenVaultRecord): Promise<void>;
  getToken(recordId: string): Promise<TokenVaultRecord | null>;
}
