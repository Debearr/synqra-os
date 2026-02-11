import { createSign } from "crypto";

type TelemetryEventName =
  | "content_created"
  | "content_approved"
  | "content_scheduled"
  | "content_published";

type TelemetryProperties = Record<string, unknown>;

type TelemetryResult = {
  ok: boolean;
  status?: number;
  reason?: string;
};

const TOKEN_URI = "https://oauth2.googleapis.com/token";
const FIRESTORE_AUDIENCE_SCOPE = "https://www.googleapis.com/auth/datastore";

type FirestoreValue =
  | { nullValue: null }
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values: FirestoreValue[] } };

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function toFirestoreValue(input: unknown): FirestoreValue {
  if (input === null || input === undefined) return { nullValue: null };
  if (typeof input === "string") return { stringValue: input };
  if (typeof input === "boolean") return { booleanValue: input };

  if (typeof input === "number") {
    if (Number.isInteger(input)) {
      return { integerValue: String(input) };
    }
    return { doubleValue: input };
  }

  if (Array.isArray(input)) {
    return {
      arrayValue: {
        values: input.map((item) => toFirestoreValue(item)),
      },
    };
  }

  if (typeof input === "object") {
    const map: Record<string, FirestoreValue> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      map[key] = toFirestoreValue(value);
    }
    return { mapValue: { fields: map } };
  }

  return { stringValue: String(input) };
}

function buildServiceAccountJwt(clientEmail: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      sub: clientEmail,
      aud: TOKEN_URI,
      iat: now,
      exp: now + 3600,
      scope: FIRESTORE_AUDIENCE_SCOPE,
    })
  );
  const payload = `${header}.${claimSet}`;
  const signer = createSign("RSA-SHA256");
  signer.update(payload);
  signer.end();
  const signature = signer.sign(privateKey);
  return `${payload}.${base64UrlEncode(signature)}`;
}

async function getGoogleAccessToken(): Promise<string | null> {
  const directBearerToken = process.env.FIREBASE_BEARER_TOKEN?.trim();
  if (directBearerToken) return directBearerToken;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) {
    return null;
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const assertion = buildServiceAccountJwt(clientEmail, privateKey);
  const response = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json().catch(() => null)) as { access_token?: string } | null;
  return data?.access_token?.trim() || null;
}

export async function logTelemetryEvent(
  eventName: TelemetryEventName,
  properties: TelemetryProperties
): Promise<TelemetryResult> {
  const telemetryEnabled = (process.env.FIREBASE_TELEMETRY_ENABLED || "false").toLowerCase() === "true";
  if (!telemetryEnabled) {
    return { ok: false, reason: "Firebase telemetry disabled" };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const collectionId = process.env.FIREBASE_TELEMETRY_COLLECTION?.trim() || "synqra_events";

  if (!projectId) {
    return { ok: false, reason: "Missing FIREBASE_PROJECT_ID" };
  }

  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    return { ok: false, reason: "Missing Firebase credentials/token" };
  }

  const body = {
    fields: {
      event_name: { stringValue: eventName },
      created_at: { stringValue: new Date().toISOString() },
      properties: toFirestoreValue(properties),
    },
  };

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    return {
      ok: false,
      status: response.status,
      reason: `Firebase write failed (${response.status})${message ? `: ${message}` : ""}`,
    };
  }

  return { ok: true, status: response.status };
}

