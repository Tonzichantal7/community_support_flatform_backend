import { Response } from 'express';
import { AuthRequest } from '../types';
import User from '../models/User';
import { mailTransporter } from '../config/mailConfig';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendWelcomeEmail, sendEmailLoginNotification } from '../services/emailService';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const user = new User({ email, password, name });
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't block registration if email fails
    }

    // create JWT token for the new user
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret as unknown as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(201).json({ message: 'User registered successfully', token, user: { id: user.id, email: user.email, name: user.name, role: user.role, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
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
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret as unknown as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Send login notification email
    try {
      await sendEmailLoginNotification(email, user.name);
    } catch (emailError) {
      console.error('Failed to send login notification email:', emailError);
      // Don't block login if email fails
    }

    res.status(200).json({ message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name, role: user.role, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
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
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    await mailTransporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });

    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    const user = await User.findOne({ resetToken: token });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'Old password and new password are required' });
      return;
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid old password' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.profilePicture = req.file.path;
    await user.save();

    res.status(200).json({ message: 'Profile picture uploaded successfully', user });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    console.log('File received:', req.file);

    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { name, email, currentPassword, newPassword } = req.body;

    if (name) user.name = name;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
      user.email = email;
    }

    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }
      user.password = newPassword;
    }

    if (req.file) {
      user.profilePicture = `uploads/${req.file.filename}`;
      console.log('ProfilePicture set:', user.profilePicture);
    }

    await user.save();
    console.log('Saved profilePicture:', user.profilePicture);

    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};
