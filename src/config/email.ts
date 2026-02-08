import nodemailer from 'nodemailer';

/**
 * Nodemailer transporter using environment variables
 */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1'
  },
  requireTLS: false,
  dnsTimeout: 10000
} as any);

/**
 * Verify email connection on startup
 */
export const verifyEmailConnection = async (): Promise<void> => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
  } catch (error: any) {
    console.warn('⚠️ Email server connection failed (non-critical):', error.message);
    // Silently fail - don't throw or log full error
  }
};
