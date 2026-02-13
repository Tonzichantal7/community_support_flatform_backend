import { Response } from 'express';
import User from '../models/User';
import ModerationHistory from '../models/ModerationHistory';
import { AuthRequest } from '../types';

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

    const user = await User.findOne({ id: userId });
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

    const user = await User.findOne({ id: userId });
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
