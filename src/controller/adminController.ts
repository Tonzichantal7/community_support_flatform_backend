import { Response } from 'express';
import User from '../models/User';
import ModerationHistory from '../models/ModerationHistory';
import { AuthRequest } from '../types';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({});
    const users = await User.find({}).select('id name email role isBanned createdAt profilePicture isOnline lastSeen').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    
    res.status(200).json({ 
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { role } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!role || !['user', 'helper', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be user, helper, or admin' });
      return;
    }

    const user = await User.findOne({ $or: [{ id: userId }, { _id: userId }] });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: 'User role updated successfully',
      data: { userId: user.id, role: user.role }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const banUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { banType, reason, duration } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!banType || !reason) {
      res.status(400).json({ error: 'banType and reason are required' });
      return;
    }

    if (banType === 'temporary' && !duration) {
      res.status(400).json({ error: 'duration is required for temporary bans' });
      return;
    }

    const user = await User.findOne({ $or: [{ id: userId }, { _id: userId }] });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.role === 'admin') {
      res.status(403).json({ error: 'Cannot ban admin users' });
      return;
    }

    if (userId === adminId) {
      res.status(403).json({ error: 'Cannot ban yourself' });
      return;
    }

    let banExpiresAt: Date | undefined;
    if (banType === 'temporary' && duration) {
      banExpiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    }

    user.isBanned = true;
    user.banType = banType;
    user.banReason = reason;
    user.bannedAt = new Date();
    user.bannedBy = adminId;
    if (banExpiresAt) {
      user.banExpiresAt = banExpiresAt;
    }
    user.banCount = (user.banCount || 0) + 1;
    await user.save();

    await ModerationHistory.create({
      action: 'ban_user',
      targetType: 'user',
      targetId: userId as string,
      moderatorId: adminId as string,
      reason,
      details: {
        banType,
        duration: duration || null,
        expiresAt: banExpiresAt || null,
        banCount: user.banCount
      }
    });

    res.status(200).json({
      message: 'User banned successfully',
      data: {
        userId: user.id,
        banType: user.banType,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        banExpiresAt: user.banExpiresAt,
        banCount: user.banCount
      }
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

export const unbanUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findOne({ $or: [{ id: userId }, { _id: userId }] });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isBanned = false;
    user.banType = null;
    delete user.banReason;
    delete user.bannedAt;
    delete user.bannedBy;
    delete user.banExpiresAt;
    await user.save();

    await ModerationHistory.create({
      action: 'unban_user',
      targetType: 'user',
      targetId: userId as string,
      moderatorId: adminId as string,
      reason: 'User unbanned by admin'
    });

    res.status(200).json({
      message: 'User unbanned successfully',
      data: {
        userId: user.id,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    console.log('Fetching user by ID:', userId);

    const user = await User.findOne({ id: userId }).select('id name email role').lean();
    console.log('User found:', user);
    
    if (!user) {
      console.log('User not found for ID:', userId);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
