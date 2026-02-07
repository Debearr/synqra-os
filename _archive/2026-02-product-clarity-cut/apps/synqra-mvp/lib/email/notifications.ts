/**
 * ============================================================
 * EMAIL NOTIFICATIONS - PILOT APPLICATIONS
 * ============================================================
 * Simple email notifications for Phase 3
 * Uses SMTP configuration from .env
 */

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  adminEmail: string;
}

interface PilotApplicationData {
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  companySize: string;
  linkedinProfile?: string;
  whyPilot: string;
}

// Get email configuration from environment
function getEmailConfig(): EmailConfig | null {
  const config = {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@synqra.com',
    adminEmail: process.env.ADMIN_EMAIL || '',
  };

  // Check if email is configured
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return null;
  }

  return config;
}

/**
 * Send confirmation email to applicant
 */
export async function sendApplicantConfirmation(
  data: PilotApplicationData
): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig();

  if (!config) {
    console.warn('[Email] SMTP not configured, skipping applicant email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    // In production, use nodemailer or similar
    // For now, log the email that would be sent
    const emailContent = {
      to: data.email,
      from: config.fromEmail,
      subject: 'Application Received — Synqra Founder Pilot',
      html: generateApplicantEmail(data),
    };

    console.log('[Email] Applicant confirmation email:', {
      to: emailContent.to,
      subject: emailContent.subject,
    });

    // TODO: Uncomment when nodemailer is added
    // await sendEmail(config, emailContent);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('[Email] Failed to send applicant email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send internal notification to admin
 */
export async function sendAdminNotification(
  data: PilotApplicationData
): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig();

  if (!config || !config.adminEmail) {
    console.warn('[Email] Admin email not configured, skipping notification');
    return { success: false, error: 'Admin email not configured' };
  }

  try {
    const emailContent = {
      to: config.adminEmail,
      from: config.fromEmail,
      subject: `🚀 New Pilot Application: ${data.fullName} (${data.companyName})`,
      html: generateAdminEmail(data),
    };

    console.log('[Email] Admin notification email:', {
      to: emailContent.to,
      subject: emailContent.subject,
    });

    // TODO: Uncomment when nodemailer is added
    // await sendEmail(config, emailContent);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('[Email] Failed to send admin email:', message);
    return { success: false, error: message };
  }
}

/**
 * Generate applicant confirmation email HTML
 */
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
    .cta { display: inline-block; background: #C5A572; color: #0A0A0A; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; letter-spacing: 0.025em; text-transform: uppercase; font-size: 14px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Application Received</h1>
      <p style="color: #666; margin-top: 8px;">Synqra Founder Pilot</p>
    </div>
    
    <p>Hi ${data.fullName},</p>
    
    <p>Thank you for applying to the Synqra Founder Pilot program. We've received your application and our team will review it within the next 24 hours.</p>
    
    <div class="content">
      <h3 style="margin-top: 0; color: #C5A572; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase;">What Happens Next</h3>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div>Our team will review your application within 24 hours</div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div>Check your email for approval notification and payment link</div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div>Once approved, complete payment to secure your founder spot</div>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <div>You'll receive onboarding instructions immediately after payment</div>
        </div>
      </div>
    </div>
    
    <p><strong>Application Details:</strong></p>
    <ul style="color: #666;">
      <li><strong>Company:</strong> ${data.companyName}</li>
      <li><strong>Role:</strong> ${data.role}</li>
      <li><strong>Company Size:</strong> ${data.companySize} employees</li>
    </ul>
    
    <p>Questions? Reply to this email or reach out to <a href="mailto:pilot@synqra.com" style="color: #2DD4BF;">pilot@synqra.com</a></p>
    
    <div class="footer">
      <p style="margin: 0;">NØID × Synqra</p>
      <p style="margin: 4px 0; font-style: italic; color: #999;">"Drive Unseen. Earn Smart."</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate admin notification email HTML
 */
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
    .cta { display: inline-block; background: #C5A572; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert">
      <h2 style="margin: 0 0 8px 0;">🚀 New Pilot Application</h2>
      <p style="margin: 0; color: #666;">Review and approve within 24 hours</p>
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
    
    ${data.linkedinProfile ? `
    <div class="field">
      <div class="label">LinkedIn</div>
      <div class="value"><a href="${data.linkedinProfile}">${data.linkedinProfile}</a></div>
    </div>
    ` : ''}
    
    <div class="field">
      <div class="label">Why Pilot?</div>
      <div class="value">${data.whyPilot}</div>
    </div>
    
    <p style="margin-top: 32px;">
      <a href="https://supabase.com/dashboard" class="cta">Review in Dashboard →</a>
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 32px;">
      <strong>Next Steps:</strong><br>
      1. Review application in Supabase dashboard<br>
      2. Approve/Reject within 24 hours<br>
      3. If approved, system will send payment link (Phase 4)
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Helper: Send email using SMTP (nodemailer implementation)
 * TODO: Install nodemailer and implement this
 */
// async function sendEmail(config: EmailConfig, email: any): Promise<void> {
//   const nodemailer = require('nodemailer');
//   
//   const transporter = nodemailer.createTransport({
//     host: config.smtpHost,
//     port: config.smtpPort,
//     secure: config.smtpSecure,
//     auth: {
//       user: config.smtpUser,
//       pass: config.smtpPass,
//     },
//   });
//   
//   await transporter.sendMail(email);
// }
