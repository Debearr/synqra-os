#!/usr/bin/env node
/**
 * Pilot Tester Invitation Script
 * Creates test users and sends invitation emails
 * Generated: 2025-11-10
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tjfeindwmpuyayjvftke.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.privateemail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'noreply@noidlux.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@noidlux.com';

if (!SUPABASE_SERVICE_KEY || !SMTP_PASS) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY and SMTP_PASS required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configure email transport
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Pilot tester list
const PILOT_TESTERS = [
  {
    email: 'debear@noidlux.com',
    name: 'Debear',
    role: 'Admin',
    access_level: 'full'
  },
  // Add more testers here
];

async function sendInviteEmail(tester, accessToken) {
  const inviteUrl = `https://synqra.co/onboard?token=${accessToken}`;
  
  const mailOptions = {
    from: `Synqra OS <${FROM_EMAIL}>`,
    to: tester.email,
    subject: '🚀 Welcome to Synqra OS Beta Program',
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0066cc;">Welcome to Synqra OS Beta! 🎉</h1>
        
        <p>Hi ${tester.name},</p>
        
        <p>You've been invited to join the Synqra OS pilot program. As a beta tester, you'll get early access to:</p>
        
        <ul>
          <li>✨ AI-powered content generation</li>
          <li>🤖 Multi-agent voice system (Sales, Support, Service)</li>
          <li>📊 Advanced analytics and insights</li>
          <li>🔄 Automated social media posting</li>
        </ul>
        
        <div style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Activate Your Account
          </a>
        </div>
        
        <p><strong>Your Access Level:</strong> ${tester.access_level}</p>
        <p><strong>Your Role:</strong> ${tester.role}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <h3>Getting Started:</h3>
        <ol>
          <li>Click the activation link above</li>
          <li>Complete your profile setup</li>
          <li>Explore the dashboard at <a href="https://synqra.co">synqra.co</a></li>
          <li>Test the agent system at <a href="https://synqra.co/agents">synqra.co/agents</a></li>
        </ol>
        
        <h3>Need Help?</h3>
        <p>Contact us at <a href="mailto:hello@noidlux.com">hello@noidlux.com</a></p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          — The Synqra Team
        </p>
      </div>
    `,
    text: `
Welcome to Synqra OS Beta!

Hi ${tester.name},

You've been invited to join the Synqra OS pilot program.

Activation Link: ${inviteUrl}

Your Access Level: ${tester.access_level}
Your Role: ${tester.role}

Getting Started:
1. Click the activation link
2. Complete your profile setup
3. Explore the dashboard at https://synqra.co
4. Test the agent system at https://synqra.co/agents

Need help? Contact us at hello@noidlux.com

— The Synqra Team
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`   ✅ Email sent to ${tester.email}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to send email to ${tester.email}:`, error.message);
    return false;
  }
}

async function createPilotUser(tester) {
  try {
    // Create user in Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: tester.email,
      email_confirm: false,
      user_metadata: {
        name: tester.name,
        role: tester.role,
        access_level: tester.access_level,
        pilot_program: true,
        invited_at: new Date().toISOString(),
      }
    });

    if (userError) {
      console.error(`   ❌ Failed to create user ${tester.email}:`, userError.message);
      return null;
    }

    console.log(`   ✅ User created: ${tester.email}`);
    
    // Generate access token (simplified - in production use proper invite token)
    const accessToken = userData.user.id;
    
    return accessToken;

  } catch (error) {
    console.error(`   ❌ Error creating user ${tester.email}:`, error.message);
    return null;
  }
}

async function invitePilotTesters() {
  console.log('👥 Synqra OS - Pilot Tester Invitation');
  console.log('======================================');
  console.log('');
  console.log(`📧 Email Server: ${SMTP_HOST}`);
  console.log(`📍 Supabase: ${SUPABASE_URL}`);
  console.log(`👤 Inviting ${PILOT_TESTERS.length} tester(s)...`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const tester of PILOT_TESTERS) {
    console.log(`📬 Processing: ${tester.name} (${tester.email})`);
    
    // Create user
    const accessToken = await createPilotUser(tester);
    
    if (!accessToken) {
      failCount++;
      continue;
    }

    // Send invite email
    const emailSent = await sendInviteEmail(tester, accessToken);
    
    if (emailSent) {
      successCount++;
    } else {
      failCount++;
    }

    console.log('');
  }

  console.log('📊 Summary:');
  console.log(`   ✅ Successful invitations: ${successCount}`);
  console.log(`   ❌ Failed invitations: ${failCount}`);
  console.log('');

  if (successCount > 0) {
    console.log('✅ Pilot tester invitations complete!');
    console.log('📧 Check your email delivery logs');
    console.log('👉 Monitor responses at https://synqra.co/admin');
  } else {
    console.log('⚠️  No invitations sent successfully');
  }
}

invitePilotTesters().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
