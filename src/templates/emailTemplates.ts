interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Welcome email for new users
 */
export const welcomeEmailTemplate = (userName: string): EmailTemplate => {
  return {
    subject: 'Welcome to Community Support Platform!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #4CAF50; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Community Support!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Thank you for joining our community platform. We're excited to have you here!</p>
          <p><strong>You can now:</strong></p>
          <ul>
            <li>Post service requests</li>
            <li>Offer help to community members</li>
            <li>Browse available services</li>
            <li>Connect with your community</li>
          </ul>
          <div style="text-align: center;">
            <a href="${FRONTEND_URL}" class="button">Get Started</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 Community Support Platform. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to Community Support Platform!\n\nHello ${userName}!\n\nThank you for joining our community platform.\n\nYou can now:\n- Post service requests\n- Offer help to community members\n- Browse available services\n- Connect with your community\n\nVisit ${FRONTEND_URL} to get started.`,
  };
};

/**
 * New response notification
 */
export const newResponseEmailTemplate = (
  userName: string,
  requestTitle: string,
  responderName: string,
  responseContent: string,
  requestId: string
): EmailTemplate => {
  const truncatedContent = responseContent.length > 200 
    ? responseContent.substring(0, 200) + '...' 
    : responseContent;
    
  return {
    subject: `New Response to Your Request: ${requestTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #2196F3; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .response-box { background-color: white; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📬 New Response Received!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p><strong>${responderName}</strong> has responded to your request:</p>
          <p><em>"${requestTitle}"</em></p>
          <div class="response-box">
            <p>${truncatedContent}</p>
          </div>
          <div style="text-align: center;">
            <a href="${FRONTEND_URL}/requests/${requestId}" class="button">View Full Response</a>
          </div>
        </div>
        <div class="footer">
          <p>You're receiving this because you posted a request on Community Support Platform.</p>
        </div>
      </body>
      </html>
    `,
    text: `New Response Received!\n\nHello ${userName}!\n\n${responderName} has responded to your request: "${requestTitle}"\n\nResponse:\n${truncatedContent}\n\nView full response at: ${FRONTEND_URL}/requests/${requestId}`,
  };
};

/**
 * Request flagged notification
 */
export const requestFlaggedEmailTemplate = (
  userName: string,
  requestTitle: string,
  reason: string,
  requestId: string
): EmailTemplate => {
  return {
    subject: '⚠️ Your Request Has Been Flagged',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #FF9800; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .warning-box { background-color: #fff3cd; padding: 20px; border-left: 4px solid #FF9800; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ Request Flagged for Review</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Your request has been flagged by a community member for review.</p>
          <p><strong>Request:</strong> "${requestTitle}"</p>
          <div class="warning-box">
            <p><strong>Reason:</strong> ${reason}</p>
          </div>
          <p>Our moderation team will review this report. If your request violates our community guidelines, it may be removed.</p>
          <p>If you believe this was reported in error, please contact our support team.</p>
          <div style="text-align: center;">
            <a href="${FRONTEND_URL}/requests/${requestId}" class="button">View Request</a>
          </div>
        </div>
        <div class="footer">
          <p>Please ensure all content follows our community guidelines.</p>
        </div>
      </body>
      </html>
    `,
    text: `⚠️ Request Flagged for Review\n\nHello ${userName},\n\nYour request "${requestTitle}" has been flagged by a community member.\n\nReason: ${reason}\n\nOur moderation team will review this report.\n\nView request: ${FRONTEND_URL}/requests/${requestId}`,
  };
};

/**
 * Admin notification for new abuse report
 */
export const adminAbuseReportEmailTemplate = (
  reporterName: string,
  reason: string,
  description: string,
  targetType: string,
  reportId: string
): EmailTemplate => {
  return {
    subject: `🚨 New Abuse Report - ${targetType.toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #f44336; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .alert-box { background-color: #ffebee; padding: 20px; border-left: 4px solid #f44336; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 New Abuse Report</h1>
        </div>
        <div class="content">
          <h2>Admin Alert</h2>
          <p>A new abuse report has been submitted and requires your review.</p>
          <div class="alert-box">
            <p><strong>Reporter:</strong> ${reporterName}</p>
            <p><strong>Target Type:</strong> ${targetType}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Description:</strong> ${description || 'No additional details provided'}</p>
          </div>
          <p><strong>Action Required:</strong> Please review this report and take appropriate action.</p>
          <div style="text-align: center;">
            <a href="${FRONTEND_URL}/admin/reports/${reportId}" class="button">Review Report Now</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated admin notification from Community Support Platform.</p>
        </div>
      </body>
      </html>
    `,
    text: `🚨 New Abuse Report\n\nAdmin Alert\n\nA new abuse report has been submitted.\n\nReporter: ${reporterName}\nTarget Type: ${targetType}\nReason: ${reason}\nDescription: ${description || 'No additional details provided'}\n\nReview at: ${FRONTEND_URL}/admin/reports/${reportId}`,
  };
};
