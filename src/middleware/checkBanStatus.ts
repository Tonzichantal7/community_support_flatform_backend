import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';

export const checkBanStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.isBanned) {
      if (user.banType === 'temporary' && user.banExpiresAt) {
        if (new Date() > user.banExpiresAt) {
          user.isBanned = false;
          user.banType = null;
          delete user.banExpiresAt;
          await user.save();
          next();
          return;
        }
      }

      res.status(403).json({
        message: 'Your account has been banned',
        banType: user.banType,
        reason: user.banReason,
        expiresAt: user.banExpiresAt
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking ban status:', error);
    res.status(500).json({ error: 'Failed to check ban status' });
  }
};
