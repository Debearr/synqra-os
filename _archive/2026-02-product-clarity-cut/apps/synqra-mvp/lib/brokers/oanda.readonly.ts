import type { BrokerPermissions, BrokerScope } from "@/lib/brokers/types";

const READ_ONLY_SCOPES: BrokerScope[] = [
  "read:accounts",
  "read:positions",
  "read:prices",
  "read:orders",
];

const RESTRICTED_ACTIONS = [
  "order placement",
  "order modification",
  "position closing",
  "trade execution",
];

const READ_ONLY_PATH_ALLOWLIST = [
  "/accounts",
  "/pricing",
  "/positions",
  "/trades",
  "/orders",
];

// Regulatory safety: enforce read-only scopes for broker access.
export function assertReadOnlyScopes(scopes: string[]): void {
  const invalid = scopes.filter((scope) => !READ_ONLY_SCOPES.includes(scope as BrokerScope));
  if (invalid.length > 0) {
    throw new Error(`Read-only access required. Invalid scopes: ${invalid.join(", ")}`);
  }
}

export function getReadOnlyPermissions(): BrokerPermissions {
  return {
    provider: "oanda",
    scopes: READ_ONLY_SCOPES,
    mode: "read-only",
    restrictedActions: RESTRICTED_ACTIONS,
  };
}

function assertReadOnlyRequest(method: string, path: string) {
  if (method !== "GET") {
    throw new Error("Read-only broker client blocks non-GET requests");
  }
  const allowed = READ_ONLY_PATH_ALLOWLIST.some((allowedPath) =>
    path.startsWith(allowedPath)
  );
  if (!allowed) {
    throw new Error("Read-only broker client blocks non-approved endpoints");
  }
}

export class OandaReadOnlyClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string, scopes: string[]) {
    assertReadOnlyScopes(scopes);
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  async get(path: string) {
    assertReadOnlyRequest("GET", path);
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`OANDA read-only request failed: ${response.status}`);
    }
    return response.json();
  }
}
