import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import User from '../models/User';
import { AuthRequest, UserRole } from '../types';
import { 
  sendWelcomeEmail, 
  sendPasswordResetEmail, 
  sendPasswordChangedEmail,
  sendEmailLoginNotification,
  sendProfilePictureUpdatedEmail
} from '../services/emailService';


export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    console.log('📝 Registration attempt:', { email, name });

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ Email already exists:', email);
      res.status(409).json({ 
        error: 'An account with this email already exists. Please use a different email or try logging in.' 
      });
      return;
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: UserRole.USER
    });

    console.log('✅ User created successfully:', user.id);

    // Send welcome email (NON-BLOCKING!)
    (async () => {
      try {
        await sendWelcomeEmail(email, name);
        console.log('📧 Welcome email sent to:', email);
      } catch (e) {
        console.warn('⚠️ Failed to send welcome email:', e);
      }
    })();

    // Prepare response
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      success: true, 
      user: userWithoutPassword, 
      token,
      message: 'Registration successful'
    });
  } catch (error: any) {
    console.error('❌ [auth/register] Error:', error.message);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'No account found with this email. Please register first or check your email address.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Incorrect password. Please check your password and try again.' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();

    // Send login notification email (non-blocking)
    (async () => {
      try {
        await sendEmailLoginNotification(user.email, user.name);
      } catch (e) {
        console.warn('[auth/login] failed to send login notification email', e);
      }
    })();

    res.status(200).json({ 
      success: true, 
      token, 
      user: userWithoutPassword,
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('[auth/login] Error:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ id: req.user!.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(200).json({ message: 'If email exists, reset token will be sent' });
      return;
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: 'Reset token generated', resetToken });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    // Send confirmation email that password was reset
    try {
      await sendPasswordChangedEmail(user.email);
    } catch (e) {
      console.warn('[auth/resetPassword] failed to send confirmation email', e);
    }

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const user = await User.findOne({ id: req.user!.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    // Send password changed email
    await sendPasswordChangedEmail(user.email);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ id: req.user!.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '../../uploads', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profilePicture = req.file.filename;
    await user.save();

    (async () => {
      try {
        await sendProfilePictureUpdatedEmail(user.email);
      } catch (e) {
        console.warn('[auth/uploadProfilePicture] failed to send notification email', e);
      }
    })();

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: AuthRequest, res: Response): void => {
  res.status(200).json({ message: 'Logout successful' });
};
