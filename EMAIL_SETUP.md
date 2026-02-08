# Email Notification System - Setup Guide

## ✅ Installation Complete

The email notification system has been successfully integrated into your Community Support Platform.

## 📦 Required Package

Install nodemailer (if not already installed):
```bash
npm install nodemailer @types/nodemailer
```

## 🔧 Configuration

### Environment Variables (.env)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=chantaluwitonze6@gmail.com
EMAIL_PASSWORD=qnvfyfnsekonktoe
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup
- ✅ Your Gmail App Password is configured
- ✅ Make sure 2-factor authentication is enabled on chantaluwitonze6@gmail.com
- ✅ All emails will be sent from chantaluwitonze6@gmail.com

## 📧 Email Notifications Implemented

### 1. Welcome Email
**Trigger:** User registration
**Recipient:** New user
**Template:** Professional welcome email with platform features
**Integration:** Automatically sent in auth controller (non-blocking)

### 2. New Response Notification
**Trigger:** Someone responds to a user's request
**Recipient:** Request owner
**Template:** Notification with responder name, truncated content, and link to view full response
**Integration:** Automatically sent in response controller (non-blocking)

### 3. Request Flagged Alert
**Trigger:** Request is reported for abuse
**Recipient:** Request owner
**Template:** Warning notification with reason and moderation notice
**Integration:** Automatically sent in abuse report controller (non-blocking)

### 4. Admin Abuse Report Alert
**Trigger:** New abuse report is submitted
**Recipient:** All admin users
**Template:** Detailed report information with review link
**Integration:** Automatically sent to all admins (non-blocking)

## 📁 Files Created/Modified

### New Files:
1. `src/config/email.ts` - Nodemailer configuration and connection verification
2. `src/templates/emailTemplates.ts` - HTML and text email templates

### Modified Files:
1. `src/services/emailService.ts` - Added new notification functions
2. `src/controllers/abuseReportController.ts` - Integrated email notifications
3. `src/controllers/responseController.ts` - Updated to use new notification function
4. `src/server.ts` - Added email connection verification on startup
5. `.env` - Added FRONTEND_URL

## 🎨 Email Templates

All emails include:
- ✅ Professional HTML design with inline CSS
- ✅ Plain text fallback version
- ✅ Responsive layout (max-width: 600px)
- ✅ Branded headers with colors
- ✅ Call-to-action buttons
- ✅ Footer with platform information

## 🚀 How It Works

### Non-Blocking Email Sending
All email notifications are sent asynchronously without blocking the main request:

```typescript
// Example from response controller
sendNewResponseNotification(
  request.userId,
  request.title,
  responder.name,
  content,
  request.id
).catch(err => console.error('Response notification failed:', err));
```

### Error Handling
- Email failures do NOT break main functionality
- All email operations are logged (success and failures)
- Missing users are handled gracefully
- Connection errors are caught and logged

## 📊 Email Verification

On server startup, the system verifies email connection:
```
✅ Email server is ready to send messages
```

If connection fails:
```
❌ Email server connection failed: [error details]
```

## 🧪 Testing

### Test Welcome Email
Register a new user and check the email inbox.

### Test Response Notification
1. Create a request
2. Have another user respond to it
3. Check request owner's email

### Test Flagged Notification
1. Submit an abuse report for a request
2. Check request owner's email
3. Check all admin emails

## 🔍 Monitoring

Check console logs for email operations:
- `✅ Welcome email sent to [email]`
- `✅ New response notification sent to [email]`
- `✅ Request flagged notification sent to [email]`
- `✅ Abuse report notifications sent to X admin(s)`
- `❌ Error sending [type] email: [error]`

## 🎯 Email Flow

```
User Registration → Welcome Email
    ↓
User Creates Request
    ↓
Another User Responds → Response Notification to Request Owner
    ↓
User Reports Content → Flagged Notification to Content Owner
                     → Admin Alert to All Admins
```

## 🛠️ Customization

### Update Email Templates
Edit `src/templates/emailTemplates.ts` to customize:
- Email subjects
- HTML design
- Text content
- Colors and styling

### Update Frontend URL
Change `FRONTEND_URL` in `.env` for production:
```
FRONTEND_URL=https://your-production-domain.com
```

### Add More Notifications
Follow the pattern in `src/services/emailService.ts`:
1. Create template in `emailTemplates.ts`
2. Add function in `emailService.ts`
3. Call from appropriate controller (non-blocking)

## ✨ Features

- ✅ Professional HTML email templates
- ✅ Plain text fallback
- ✅ Non-blocking email sending
- ✅ Comprehensive error handling
- ✅ Logging for all operations
- ✅ Gmail SMTP integration
- ✅ Multi-recipient support (admin notifications)
- ✅ Dynamic content insertion
- ✅ Responsive design
- ✅ Production-ready

## 🎉 Ready to Use!

Your email notification system is fully configured and ready to send emails. Start your server and test the notifications!

```bash
npm run dev
```

Look for the email verification message in console:
```
✅ Email server is ready to send messages
```
