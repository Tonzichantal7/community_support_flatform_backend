import nodemailer from "nodemailer";

const {
  EMAIL_USER,
  EMAIL_PASSWORD,
} = process.env;

const emailEnabled = Boolean(EMAIL_USER && EMAIL_PASSWORD);

if (!emailEnabled) {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASSWORD not set - emails will be logged to console');
}

export const mailTransporter = emailEnabled
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, 
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, 
        minVersion: "TLSv1",      
      },
      requireTLS: false,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      dnsTimeout: 10000
    } as any)
  : nodemailer.createTransport({ jsonTransport: true });
