import nodemailer from "nodemailer";

export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT), // 587
  secure: false, // use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,  // Gmail address
    pass: process.env.EMAIL_PASSWORD, // 16-char App Password
  },
});
