import { getRefreshToken } from "@/lib/integrations/google/token-store";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        access_token?: string;
        error_description?: string;
      }
    | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || `Google token exchange failed (${response.status})`);
  }

  return payload.access_token;
}

async function createDraft(accessToken: string, to: string): Promise<string> {
  const subject = "[Synqra Test] Automation Worker Gmail Connection";
  const body = [
    "This is a test draft created by the Synqra automation worker.",
    "If you see this in Gmail Drafts, the Gmail integration is working.",
    `Timestamp: ${new Date().toISOString()}`,
  ].join("\n");

  const message = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    body,
  ].join("\r\n");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        raw: toBase64Url(message),
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null;
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.error?.message || `Gmail draft creation failed (${response.status})`);
  }

  return payload.id;
}

async function run() {
  const testUserId = requireEnv("TEST_USER_ID");
  const draftRecipient = process.env.GMAIL_TEST_TO?.trim() || "your-email@example.com";

  const refreshToken = await getRefreshToken(testUserId);
  if (!refreshToken) {
    throw new Error(`No Google refresh token found for TEST_USER_ID=${testUserId}`);
  }

  const accessToken = await exchangeRefreshToken(refreshToken);
  const draftId = await createDraft(accessToken, draftRecipient);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        draftId,
        recipient: draftRecipient,
      },
      null,
      2
    ) + "\n"
  );
}

run().catch((error) => {
  process.stderr.write(`gmail connection test failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});

