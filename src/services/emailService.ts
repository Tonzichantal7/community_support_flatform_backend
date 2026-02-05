import nodemailer from 'nodemailer';


console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD set?', process.env.EMAIL_PASSWORD ? '✅' : '❌');


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // 587
  secure: false,                        // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,  // 16-char App Password
  },
});

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
    const mailOptions = {
      from: `"E-Shop" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email sent] To: ${to}, Subject: ${subject}, MessageId: ${info.messageId}`);
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
  const subject = 'Welcome to E-Shop - Registration Successful!';
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
                <h1>Welcome to E-Shop!</h1>
            </div>
            <div class="content">
                <h2>Hello ${name}!</h2>
                <p>Thank you for registering with E-Shop. Your account has been created successfully.</p>
                <p>You can now:</p>
                <ul>
                    <li>Browse our extensive product catalog</li>
                    <li>Add items to your cart</li>
                    <li>Place orders securely</li>
                    <li>Track your order status</li>
                </ul>
                <p>Start shopping now and discover amazing deals!</p>
            </div>
            <div class="footer">
                <p>Thank you for choosing E-Shop!</p>
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
