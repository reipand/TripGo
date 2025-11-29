import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const fromEmail = process.env.EMAIL_FROM || smtpUser;

export function getTransporter() {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}) {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: options.from || fromEmail,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
  return info;
}


