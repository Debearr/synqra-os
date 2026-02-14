import { Resend } from "resend";

function requireEnv(name: "RESEND_API_KEY" | "FROM_EMAIL" | "ADMIN_EMAIL"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

type EmailRuntimeConfig = {
  client: Resend;
  fromEmail: string;
  adminEmail: string;
};

function getEmailRuntimeConfig(): EmailRuntimeConfig {
  const apiKey = requireEnv("RESEND_API_KEY");
  const fromEmail = requireEnv("FROM_EMAIL");
  const adminEmail = requireEnv("ADMIN_EMAIL");
  return {
    client: new Resend(apiKey),
    fromEmail,
    adminEmail,
  };
}

export async function sendTransactionalEmail(to: string, subject: string, html: string): Promise<void> {
  const trimmedTo = to.trim();
  if (!trimmedTo) {
    throw new Error("Recipient email is required");
  }
  if (!subject.trim()) {
    throw new Error("Email subject is required");
  }
  if (!html.trim()) {
    throw new Error("Email html content is required");
  }

  const { client, fromEmail } = getEmailRuntimeConfig();
  const { data, error } = await client.emails.send({
    from: fromEmail,
    to: trimmedTo,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("Resend send failed: missing message id");
  }
}

export function getAdminEmail(): string {
  return getEmailRuntimeConfig().adminEmail;
}
