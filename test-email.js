// Simple SMTP connectivity + send test for NØID / Synqra email system

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const requiredEnv = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'FROM_EMAIL',
  'ADMIN_EMAIL',
  'SYSTEM_EMAIL',
  'EMAIL_PROVIDER'
];

const missing = requiredEnv.filter((key) => !process.env[key]);
const logFile = path.join(__dirname, 'logs', 'email-setup.txt');

function appendLog(entry) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${entry}`;
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `${message}\n`, { encoding: 'utf8' });
}

async function run() {
  if (missing.length > 0) {
    const msg = `Missing environment variables: ${missing.join(', ')}`;
    appendLog(`ERROR: ${msg}`);
    throw new Error(msg);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"NØID System" <${process.env.FROM_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: '✅ NØID Mail Test — Private Email Integration Successful',
    text: `Hello De Bear,\n\nYour Namecheap Private Email setup is working perfectly!\n\nDomain: ${process.env.EMAIL_PROVIDER}\nSystem Email: ${process.env.SYSTEM_EMAIL}\nSent via Synqra test script.\n\n🚀`,
    html: `
    <h2>✅ NØID Mail Test — Success!</h2>
    <p>Hello De Bear,</p>
    <p>Your <b>Namecheap Private Email</b> setup is verified and working perfectly.</p>
    <ul>
      <li><b>Domain:</b> ${process.env.EMAIL_PROVIDER}</li>
      <li><b>System Email:</b> ${process.env.SYSTEM_EMAIL}</li>
      <li><b>Sent from:</b> ${process.env.FROM_EMAIL}</li>
    </ul>
    <p>🚀 Synqra + NØID are officially connected.</p>
  `
  };

  try {
    console.log('📨 Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent:', info.messageId);
    appendLog(
      `Test email sent successfully to ${process.env.ADMIN_EMAIL} via ${process.env.EMAIL_PROVIDER}\n`
    );
    console.log('🪵 Logged to /logs/email-setup.txt');
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    appendLog(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

run();
