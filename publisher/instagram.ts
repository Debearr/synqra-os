export async function createMediaContainer({ igUserId, imageUrl, caption, accessToken }: { igUserId: string; imageUrl: string; caption?: string; accessToken: string; }): Promise<string> {
  const body = new URLSearchParams();
  body.set("image_url", imageUrl);
  if (caption) body.set("caption", caption);
  body.set("access_token", accessToken);

  const res = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // @ts-ignore - Node fetch supports timeout in some runtimes; otherwise rely on AbortController upstream
    timeout: 10000,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create IG container: ${res.status} ${res.statusText} - ${JSON.stringify(json)}`);
  }
  if (!json.id) {
    throw new Error(`No container id returned: ${JSON.stringify(json)}`);
  }
  console.log(`Created IG container: ${json.id}`);
  return json.id as string;
}

export async function waitForContainerReady({ creationId, accessToken, pollMs = 1500, maxWaitMs = 30000 }: { creationId: string; accessToken: string; pollMs?: number; maxWaitMs?: number; }): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const url = new URL(`https://graph.facebook.com/v19.0/${creationId}`);
    url.searchParams.set("fields", "status_code,status,media_type");
    url.searchParams.set("access_token", accessToken);
    const res = await fetch(url, { method: "GET" });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(`Failed to check IG container: ${res.status} ${res.statusText} - ${JSON.stringify(json)}`);
    }
    const status = json.status_code || json.status;
    if (status === "FINISHED" || status === "READY" || status === 200) return;
    if (status === "ERROR" || status === 400 || status === 500) {
      throw new Error(`IG container errored: ${JSON.stringify(json)}`);
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
  throw new Error(`Timed out waiting for IG container to be ready after ${maxWaitMs}ms`);
}

export async function publishContainer({ igUserId, creationId, accessToken }: { igUserId: string; creationId: string; accessToken: string; }): Promise<any> {
  const body = new URLSearchParams();
  body.set("creation_id", creationId);
  body.set("access_token", accessToken);

  const res = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // @ts-ignore
    timeout: 10000,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to publish IG container: ${res.status} ${res.statusText} - ${JSON.stringify(json)}`);
  }
  return json;
}

