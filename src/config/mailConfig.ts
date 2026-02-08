import nodemailer from "nodemailer";

const {
  EMAIL_USER,
  EMAIL_PASSWORD,
} = process.env;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  throw new Error("EMAIL_USER or EMAIL_PASSWORD not set");
}

export const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, 
    minVersion: "TLSv1.2",      
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});
