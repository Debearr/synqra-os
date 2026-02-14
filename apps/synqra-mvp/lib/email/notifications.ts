import { getAdminEmail, sendTransactionalEmail } from "@/lib/email/resend";

export interface PilotApplicationData {
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  companySize: string;
  linkedinProfile?: string;
  whyPilot: string;
}

export async function sendApplicantConfirmation(data: PilotApplicationData): Promise<void> {
  await sendTransactionalEmail(data.email, "Application Received - Synqra Founder Pilot", generateApplicantEmail(data));
}

export async function sendAdminNotification(data: PilotApplicationData): Promise<void> {
  const adminEmail = getAdminEmail();
  await sendTransactionalEmail(
    adminEmail,
    `New Pilot Application: ${data.fullName} (${data.companyName})`,
    generateAdminEmail(data)
  );
}

function generateApplicantEmail(data: PilotApplicationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0A0A0A; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .title { font-size: 28px; font-weight: 600; letter-spacing: 0.075em; color: #0A0A0A; margin: 0; }
    .content { background: #F5F3F0; padding: 32px; border-radius: 8px; margin: 24px 0; }
    .steps { margin: 24px 0; }
    .step { display: flex; gap: 12px; margin: 16px 0; }
    .step-number { background: rgba(45, 212, 191, 0.15); color: #2DD4BF; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; }
    .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Application Received</h1>
      <p style="color: #666; margin-top: 8px;">Synqra Founder Pilot</p>
    </div>

    <p>Hi ${data.fullName},</p>

    <p>Thank you for applying to the Synqra Founder Pilot program. We received your application and our team will review it within the next 24 hours.</p>

    <div class="content">
      <h3 style="margin-top: 0; color: #C5A572; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase;">What Happens Next</h3>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div>Our team reviews your application within 24 hours</div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div>You receive an approval update by email</div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div>If approved, you receive payment and onboarding details</div>
        </div>
      </div>
    </div>

    <p><strong>Application Details:</strong></p>
    <ul style="color: #666;">
      <li><strong>Company:</strong> ${data.companyName}</li>
      <li><strong>Role:</strong> ${data.role}</li>
      <li><strong>Company Size:</strong> ${data.companySize} employees</li>
    </ul>

    <p>Questions? Reply to this email or contact <a href="mailto:pilot@synqra.com" style="color: #2DD4BF;">pilot@synqra.com</a></p>

    <div class="footer">
      <p style="margin: 0;">Synqra</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateAdminEmail(data: PilotApplicationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0A0A0A; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .alert { background: rgba(45, 212, 191, 0.1); border-left: 4px solid #2DD4BF; padding: 20px; margin: 24px 0; }
    .field { margin: 16px 0; padding: 12px; background: #F5F3F0; border-radius: 4px; }
    .label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { margin-top: 4px; color: #0A0A0A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert">
      <h2 style="margin: 0 0 8px 0;">New Pilot Application</h2>
      <p style="margin: 0; color: #666;">Review within 24 hours</p>
    </div>

    <div class="field">
      <div class="label">Applicant</div>
      <div class="value">${data.fullName}</div>
    </div>

    <div class="field">
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
    </div>

    <div class="field">
      <div class="label">Company</div>
      <div class="value">${data.companyName}</div>
    </div>

    <div class="field">
      <div class="label">Role</div>
      <div class="value">${data.role}</div>
    </div>

    <div class="field">
      <div class="label">Company Size</div>
      <div class="value">${data.companySize} employees</div>
    </div>

    ${
      data.linkedinProfile
        ? `
    <div class="field">
      <div class="label">LinkedIn</div>
      <div class="value"><a href="${data.linkedinProfile}">${data.linkedinProfile}</a></div>
    </div>
    `
        : ""
    }

    <div class="field">
      <div class="label">Why Pilot?</div>
      <div class="value">${data.whyPilot}</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
