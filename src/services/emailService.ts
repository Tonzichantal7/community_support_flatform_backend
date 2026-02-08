import nodemailer from 'nodemailer';
import { mailTransporter } from '../config/mailConfig';

const transporter = mailTransporter;

// Send email function
const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  // Validate email format first
  if (!isValidEmail(to)) {
    console.warn('Invalid email format, skipping send:', to);
    return;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@example.com';
    const mailOptions = {
      from: `"Community Support" <${fromAddress}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions as any);
    console.log(`[Email sent] To: ${to}, Subject: ${subject}, MessageId: ${info?.messageId || 'n/a'}`);
  } catch (error: any) {
    console.error(`[Email failed] To: ${to}, Subject: ${subject}`);
    console.error('Error details:', error.message);

    // Handle specific SMTP error codes
    if (error.responseCode === 550) {
      console.warn('Invalid email address detected:', to);
    } else if (error.code === 'EAUTH') {
      console.error('SMTP Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD.');
    } else if (error.code === 'ECONNECTION') {
      console.error('SMTP Connection failed. Check SMTP_HOST and SMTP_PORT.');
    }
    
    // Re-throw for critical registration emails
    if (subject.includes('Welcome')) {
      throw error;
    }
  }
};


// Specific email functions
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const subject = 'Welcome to Community Support Platform - Registration Successful!';
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #007bff; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background: #f9f9f9; }
      .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Community Support Platform!</h1>
      </div>
      <div class="content">
        <h2>Hello ${name}!</h2>
        <p>Thank you for registering with the Community Support Platform. Your account has been created successfully.</p>
        <p>You can now:</p>
        <ul>
          <li>Post requests for help</li>
          <li>Respond to community requests</li>
          <li>Follow categories of interest</li>
          <li>Manage your profile and notifications</li>
        </ul>
        <p>Get involved and help your community!</p>
      </div>
      <div class="footer">
        <p>Thank you for joining the Community Support Platform!</p>
      </div>
    </div>
  </body>
  </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const subject = 'Password Reset Request';
  const html = `
    <h1>Password Reset</h1>
    <p>You requested a password reset. Use the following token to reset your password:</p>
    <p><strong>${resetToken}</strong></p>
    <p>This token will expire in 1 hour.</p>
  `;
  await sendEmail(email, subject, html);
};

export const sendPasswordChangedEmail = async (email: string): Promise<void> => {
  const subject = 'Password Changed Successfully';
  const html = `
    <h1>Password Changed</h1>
    <p>Your password has been changed successfully.</p>
    <p>If you did not make this change, please contact support immediately.</p>
  `;
  await sendEmail(email, subject, html);
};

export const sendEmailLoginNotification = async (email: string, name?: string): Promise<void> => {
  const subject = 'New login to your account';
  const html = `
    <h1>Hello ${name || 'there'},</h1>
    <p>We noticed a new login to your account. If this was you, no action is needed.</p>
    <p>If you did not log in, please reset your password immediately.</p>
    <p style="color:#666;font-size:12px;">Time: ${new Date().toLocaleString()}</p>
  `;
  await sendEmail(email, subject, html);
};

export const sendProfilePictureUpdatedEmail = async (email: string): Promise<void> => {
  const subject = 'Profile picture updated';
  const html = `
    <h1>Profile Picture Updated</h1>
    <p>Your profile picture was updated successfully.</p>
    <p>If you did not make this change, please update your password and review account activity.</p>
  `;
  await sendEmail(email, subject, html);
};

export const sendOrderPlacedEmail = async (email: string, orderId: string, totalAmount: number): Promise<void> => {
  const subject = 'Order Placed Successfully';
  const html = `
    <h1>Order Confirmation</h1>
    <p>Your order has been placed successfully.</p>
    <p>Order ID: ${orderId}</p>
    <p>Total Amount: $${totalAmount}</p>
    <p>Thank you for shopping with us!</p>
  `;
  await sendEmail(email, subject, html);
};

export const sendOrderStatusUpdateEmail = async (email: string, orderId: string, status: string): Promise<void> => {
  const subject = `Order Status Update: ${status}`;
  const html = `
    <h1>Order Status Update</h1>
    <p>Your order status has been updated.</p>
    <p>Order ID: ${orderId}</p>
    <p>New Status: ${status}</p>
  `;
  await sendEmail(email, subject, html);
};
// Community Service Platform Notifications

export const sendRequestCreatedEmail = async (email: string, userName: string, requestTitle: string, requestType: string): Promise<void> => {
  const subject = `Your ${requestType} has been posted successfully`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; margin-top: 10px; border-radius: 5px; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 ${requestType} Posted Successfully</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Your ${requestType.toLowerCase()} has been posted to our community platform.</p>
                <p><strong>Title:</strong> ${requestTitle}</p>
                <p>Your post is now visible to the community. Wait for responses and engagement from other users.</p>
                <p>Thank you for contributing to our community!</p>
            </div>
            <div class="footer">
                <p>Community Support Platform</p>
            </div>
        </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendRequestApprovedEmail = async (email: string, userName: string, requestTitle: string): Promise<void> => {
  const subject = 'Your Request Has Been Approved!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f0f8ff; margin-top: 10px; border-radius: 5px; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Request Approved!</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Great news! Your request has been approved by our admin team.</p>
                <p><strong>Request Title:</strong> ${requestTitle}</p>
                <p>Users can now offer services on your request. You will be notified when someone responds to your request.</p>
            </div>
            <div class="footer">
                <p>Community Support Platform</p>
            </div>
        </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendRequestRejectedEmail = async (email: string, userName: string, requestTitle: string, reason?: string): Promise<void> => {
  const subject = 'Your Request Has Been Rejected';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #fff5f5; margin-top: 10px; border-radius: 5px; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Request Rejected</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Unfortunately, your request could not be approved.</p>
                <p><strong>Request Title:</strong> ${requestTitle}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                <p>You can create a new request with revised details. Please refer to our community guidelines.</p>
            </div>
            <div class="footer">
                <p>Community Support Platform</p>
            </div>
        </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendServiceOfferEmail = async (email: string, userName: string, requestTitle: string, offererName: string): Promise<void> => {
  const subject = 'Someone Has Offered to Help!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #fffbf0; margin-top: 10px; border-radius: 5px; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤝 New Service Offer!</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p><strong>${offererName}</strong> has offered to help with your request!</p>
                <p><strong>Request Title:</strong> ${requestTitle}</p>
                <p>Log in to your account to view their offer and get in touch with them.</p>
            </div>
            <div class="footer">
                <p>Community Support Platform</p>
            </div>
        </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendResponsePostedEmail = async (email: string, userName: string, requestTitle: string, responderName: string): Promise<void> => {
  const subject = 'New Response to Your Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #f0f8ff; margin-top: 10px; border-radius: 5px; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💬 New Response</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p><strong>${responderName}</strong> has posted a response to your request!</p>
                <p><strong>Request Title:</strong> ${requestTitle}</p>
                <p>Check the details and start a conversation with the responder.</p>
            </div>
            <div class="footer">
                <p>Community Support Platform</p>
            </div>
        </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendRequestLikedEmail = async (email: string, userName: string, requestTitle: string, liker: string): Promise<void> => {
  const subject = 'Your Request Has Been Liked!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e83e8c; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #fff5fa; margin-top: 10px; border-radius: 5px; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❤️ Your Request Was Liked!</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p><strong>${liker}</strong> liked your request!</p>
                <p><strong>Request Title:</strong> ${requestTitle}</p>
                <p>Your content is getting positive engagement. Keep up the great work!</p>
            </div>
            <div class="footer">
                <p>Community Support Platform</p>
            </div>
        </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendResponseLikedEmail = async (email: string, userName: string, requestTitle: string, liker: string): Promise<void> => {
  const subject = 'Your Response Was Liked!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e83e8c; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background: #fff5fa; margin-top: 10px; border-radius: 5px; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❤️ Your Response Was Liked!</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p><strong>${liker}</strong> liked your response!</p>
                <p><strong>Request Title:</strong> ${requestTitle}</p>
                <p>Keep sharing helpful responses in our community!</p>
            </div>
            <div class="footer">
                <p>Community Support Platform</p>
            </div>
        </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};