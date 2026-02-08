import { Response } from 'express';
import ModerationHistory from '../models/ModerationHistory';
import { AuthRequest } from '../types';

export const getModerationHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', action, moderatorId, targetType } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const filter: Record<string, any> = {};
    if (action) filter.action = action;
    if (moderatorId) filter.moderatorId = moderatorId;
    if (targetType) filter.targetType = targetType;

    const history = await ModerationHistory.find(filter)
      .sort({ createdAt: -1 })
      .limit(lim)
      .skip((pageNum - 1) * lim)
      .lean();

    const total = await ModerationHistory.countDocuments(filter);
    const pages = Math.ceil(total / lim);

    res.status(200).json({
      message: 'Moderation history retrieved',
      history,
      pagination: {
        page: pageNum,
        limit: lim,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error fetching moderation history:', error);
    res.status(500).json({ error: 'Failed to fetch moderation history' });
  }
};

export const getTargetHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId } = req.params;

    if (!targetType || !targetId) {
      res.status(400).json({ error: 'targetType and targetId are required' });
      return;
    }

    const history = await ModerationHistory.find({ targetType, targetId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: 'Target history retrieved',
      history
    });
  } catch (error) {
    console.error('Error fetching target history:', error);
    res.status(500).json({ error: 'Failed to fetch target history' });
  }
};

export const getModeratorActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { moderatorId } = req.params;

    if (!moderatorId) {
      res.status(400).json({ error: 'moderatorId is required' });
      return;
    }

    const activity = await ModerationHistory.find({ moderatorId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const statistics = await ModerationHistory.aggregate([
      { $match: { moderatorId } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $project: { action: '$_id', count: 1, _id: 0 } }
    ]);

    res.status(200).json({
      message: 'Moderator activity retrieved',
      activity,
      statistics
    });
  } catch (error) {
    console.error('Error fetching moderator activity:', error);
    res.status(500).json({ error: 'Failed to fetch moderator activity' });
  }
};
