type TelemetryPayload = {
  eventName: string;
  properties: Record<string, unknown>;
};

export async function logTelemetryEvent(payload: TelemetryPayload): Promise<void> {
  const enabled = (process.env.FIREBASE_TELEMETRY_ENABLED || "false").toLowerCase() === "true";
  if (!enabled) return;

  const endpoint = process.env.FIREBASE_TELEMETRY_ENDPOINT?.trim();
  const token = process.env.FIREBASE_BEARER_TOKEN?.trim();
  if (!endpoint || !token) {
    return;
  }

  await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      eventName: payload.eventName,
      properties: payload.properties,
      createdAt: new Date().toISOString(),
    }),
  });
}

