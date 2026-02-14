import { getAdminEmail, sendTransactionalEmail } from "@/lib/email/resend";
import { maskAccessCode, type AccessCodeRole } from "@/app/api/_shared/access-codes";

type PilotAccessCodeEmailPayload = {
  applicationId: string;
  email: string;
  fullName: string;
  code: string;
  expiresAt: string;
  role: AccessCodeRole;
};

export async function sendPilotAccessCodeEmail(payload: PilotAccessCodeEmailPayload): Promise<void> {
  const expires = new Date(payload.expiresAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:0 auto;padding:24px;">
      <h1 style="margin-bottom:8px;">Your Synqra Access Code</h1>
      <p>Hello ${escapeHtml(payload.fullName)},</p>
      <p>Your Founder Pilot application was approved. Use the one-time access code below to continue.</p>
      <div style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#52525b;margin:0 0 8px 0;">One-Time Access Code</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.2em;margin:0;">${payload.code}</p>
      </div>
      <p>This code expires on <strong>${expires} UTC</strong> and can only be used once.</p>
      <p>If you did not request this, reply to this email immediately.</p>
      <p style="margin-top:24px;color:#71717a;font-size:12px;">Application ID: ${escapeHtml(payload.applicationId)}</p>
    </div>
  `.trim();

  await sendTransactionalEmail(payload.email, "Your Synqra access code", html);
}

export async function sendPilotAccessCodeAdminNotification(payload: PilotAccessCodeEmailPayload): Promise<void> {
  const adminEmail = getAdminEmail();
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin-bottom:8px;">Pilot access code issued</h2>
      <p>An access code has been issued for ${escapeHtml(payload.email)}.</p>
      <ul>
        <li><strong>Application ID:</strong> ${escapeHtml(payload.applicationId)}</li>
        <li><strong>Role:</strong> ${escapeHtml(payload.role)}</li>
        <li><strong>Code preview:</strong> ${escapeHtml(maskAccessCode(payload.code))}</li>
        <li><strong>Expires at:</strong> ${escapeHtml(payload.expiresAt)}</li>
      </ul>
      <p>No fallback channel was used.</p>
    </div>
  `.trim();

  await sendTransactionalEmail(adminEmail, `Pilot access approved: ${payload.email}`, html);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
