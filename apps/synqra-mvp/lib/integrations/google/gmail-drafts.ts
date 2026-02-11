import { getRefreshToken } from "@/lib/integrations/google/token-store";

type CreateDraftInput = {
  userId: string;
  recipient: string;
  subject: string;
  body: string;
};

type CreateDraftResult =
  | {
      status: "created";
      draftId: string;
    }
  | {
      status: "skipped" | "failed";
      draftId: null;
      reason: string;
    };

function isConnectorEnabled(): boolean {
  return (process.env.PLATFORM_CONNECTORS_ENABLED || "false").toLowerCase() === "true";
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function exchangeRefreshTokenForAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth client credentials are not configured");
  }

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

  const payload = (await response.json().catch(() => null)) as { access_token?: string; error_description?: string } | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || `OAuth token exchange failed (${response.status})`);
  }

  return payload.access_token;
}

export async function createGmailDraft(input: CreateDraftInput): Promise<CreateDraftResult> {
  if (!isConnectorEnabled()) {
    return {
      status: "skipped",
      draftId: null,
      reason: "Platform connectors are disabled",
    };
  }

  try {
    const refreshToken = await getRefreshToken(input.userId);
    if (!refreshToken) {
      return {
        status: "skipped",
        draftId: null,
        reason: "No Google refresh token available",
      };
    }

    const accessToken = await exchangeRefreshTokenForAccessToken(refreshToken);
    const mimeMessage = [
      `To: ${input.recipient}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${input.subject}`,
      "",
      input.body,
    ].join("\r\n");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          raw: toBase64Url(mimeMessage),
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null;
    if (!response.ok || !payload?.id) {
      return {
        status: "failed",
        draftId: null,
        reason: payload?.error?.message || `Gmail draft creation failed (${response.status})`,
      };
    }

    return {
      status: "created",
      draftId: payload.id,
    };
  } catch (error) {
    return {
      status: "failed",
      draftId: null,
      reason: error instanceof Error ? error.message : "Unknown Gmail draft failure",
    };
  }
}

