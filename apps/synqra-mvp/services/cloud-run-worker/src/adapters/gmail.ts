import { google } from "googleapis";

type GmailDraftInput = {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
};

type GmailLabelResult = {
  id: string;
  name: string;
};

type GmailMessageMetadata = {
  id: string;
  threadId: string | null;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  receivedAt: string | null;
};

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

function normalizeClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth client credentials are not configured");
  }
  return { clientId, clientSecret };
}

function readHeader(headers: Array<{ name?: string | null; value?: string | null }> | undefined, key: string): string {
  if (!headers?.length) return "";
  const match = headers.find((header) => (header.name || "").toLowerCase() === key.toLowerCase());
  return match?.value || "";
}

export async function exchangeRefreshTokenForAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = normalizeClientCredentials();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const tokenResponse = await oauth2Client.getAccessToken();
  const accessToken = tokenResponse?.token;
  if (!accessToken) {
    throw new Error("Unable to obtain access token from refresh token");
  }
  return accessToken;
}

export async function createGmailDraft(input: GmailDraftInput): Promise<{ draftId: string }> {
  const gmail = getGmailClient(input.accessToken);
  const message = [
    `To: ${input.to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${input.subject}`,
    "",
    input.body,
  ].join("\r\n");

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: encodeBase64Url(message),
      },
    },
  });

  const draftId = response.data.id;
  if (!draftId) {
    throw new Error("Gmail draft creation returned no draft id");
  }

  return { draftId };
}

export async function listGmailLabels(accessToken: string): Promise<GmailLabelResult[]> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.labels.list({ userId: "me" });
  const labels = response.data.labels || [];
  return labels
    .filter((label: { id?: string | null; name?: string | null }): label is { id: string; name: string } =>
      Boolean(label.id && label.name)
    )
    .map((label: { id: string; name: string }) => ({ id: label.id, name: label.name }));
}

export async function listUnreadMessageIds(accessToken: string, query = "is:unread"): Promise<string[]> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 25,
  });
  return (response.data.messages || [])
    .map((message: { id?: string | null }) => message.id)
    .filter((id: string | null | undefined): id is string => Boolean(id));
}

export async function getMessageMetadata(accessToken: string, messageId: string): Promise<GmailMessageMetadata> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: ["From", "To", "Subject", "Date"],
  });

  const payload = response.data.payload;
  const headers = (payload?.headers || []).map((item) => ({ name: item.name, value: item.value }));
  const from = readHeader(headers, "From");
  const to = readHeader(headers, "To");
  const subject = readHeader(headers, "Subject");
  const dateRaw = readHeader(headers, "Date");
  const dateParsed = dateRaw ? new Date(dateRaw) : null;
  const receivedAt = dateParsed && !Number.isNaN(dateParsed.getTime()) ? dateParsed.toISOString() : null;

  return {
    id: response.data.id || messageId,
    threadId: response.data.threadId || null,
    from,
    to,
    subject,
    snippet: response.data.snippet || "",
    receivedAt,
  };
}

export async function getPrimaryEmailAddress(accessToken: string): Promise<string> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.getProfile({ userId: "me" });
  const address = response.data.emailAddress?.trim();
  if (!address) {
    throw new Error("Unable to resolve authenticated Gmail address");
  }
  return address;
}

export async function ensureLabels(accessToken: string, labelNames: string[]): Promise<Record<string, string>> {
  const gmail = getGmailClient(accessToken);
  const existing = await listGmailLabels(accessToken);
  const map: Record<string, string> = {};

  for (const label of existing) {
    map[label.name] = label.id;
  }

  for (const labelName of labelNames) {
    if (map[labelName]) continue;
    const response = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: labelName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });
    const id = response.data.id;
    if (!id) {
      throw new Error(`Failed to create Gmail label: ${labelName}`);
    }
    map[labelName] = id;
  }

  return map;
}

export async function applyLabelsToMessage(accessToken: string, messageId: string, labelIds: string[]): Promise<void> {
  if (labelIds.length === 0) return;
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: labelIds,
    },
  });
}
