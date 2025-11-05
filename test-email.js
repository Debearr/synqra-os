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
  'ADMIN_EMAIL'
];

const missing = requiredEnv.filter((key) => !process.env[key]);
const logFile = path.join(__dirname, 'logs', 'email-setup.txt');

function appendLog(entry) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${entry}\n`;
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, message, { encoding: 'utf8' });
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
    envelope: {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL
    },
    from: process.env.FROM_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: 'Synqra + NØID Email Integration Test',
    text: 'Automated verification email from the Synqra + NØID environment.'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    appendLog(`SUCCESS: messageId=${info.messageId || 'n/a'} response=${info.response || 'n/a'}`);
    console.log('Test email sent successfully.');
  } catch (error) {
    appendLog(`ERROR: ${error.name}: ${error.message}`);
    console.error('Failed to send test email.');
    console.error(error);
    process.exitCode = 1;
  }
}

run();
