import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASSWORD;

export const emailEnabled = Boolean(smtpHost && smtpPort && smtpUser && smtpPass);

if (!emailEnabled) {
  console.warn('SMTP_HOST or credentials not set — emails will be logged to console (jsonTransport).');
}

export const mailTransporter = emailEnabled
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1'
      },
      requireTLS: false
    })
  : nodemailer.createTransport({ jsonTransport: true });

