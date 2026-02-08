import { Request, Response } from 'express';
import AbuseReport from '../models/AbuseReport';
import RequestModel from '../models/Request';
import ResponseModel from '../models/Response';
import User from '../models/User';
import { AuthRequest } from '../types';

// Create a new abuse report (authenticated users)
export const reportContent = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const reporterId = req.user?.id;

    if (!reporterId) return res.status(401).json({ error: 'User not authenticated' });
    if (!targetType || !targetId || !reason) return res.status(400).json({ error: 'targetType, targetId and reason are required' });

    // Optional: validate that the target exists for common types
    if (targetType === 'REQUEST') {
      const target = await RequestModel.findOne({ id: targetId, isActive: true } as Record<string, any>);
      if (!target) return res.status(404).json({ error: 'Target request not found' });
    }
    if (targetType === 'RESPONSE') {
      const target = await ResponseModel.findOne({ id: targetId, isActive: true } as Record<string, any>);
      if (!target) return res.status(404).json({ error: 'Target response not found' });
    }

    const report = new AbuseReport({ reporterId, targetType, targetId, reason, details });
    await report.save();

    res.status(201).json({ message: 'Report submitted', data: report });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Admin: list reports with optional filters
export const listReports = async (req: AuthRequest, res: Response) => {
  try {
    const { status, targetType, page = '1', limit = '25' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));

    const filter: Record<string, any> = { isActive: true };
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;

    const reports = await AbuseReport.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * lim).limit(lim).lean();
    const total = await AbuseReport.countDocuments(filter);

    res.json({ message: 'Reports retrieved', data: reports, meta: { total, page: pageNum, limit: lim } });
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ error: 'Failed to list reports' });
  }
};

// Admin or reporter: get report by id
export const getReport = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) return res.status(400).json({ error: 'Report id is required' });

    const report = await AbuseReport.findOne({ id, isActive: true } as Record<string, any>);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // Allow reporter or admin to view
    if (report.reporterId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this report' });
    }

    res.json({ message: 'Report retrieved', data: report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// Admin: take moderation action on a report and optionally on the target content
export const takeAction = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const { action, reason } = req.body as { action: string; reason?: string };
    const adminId = req.user?.id;

    if (!id) return res.status(400).json({ error: 'Report id is required' });
    if (!adminId) return res.status(401).json({ error: 'Admin not authenticated' });
    if (!action) return res.status(400).json({ error: 'action is required' });

    const report = await AbuseReport.findOne({ id, isActive: true } as Record<string, any>);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // Record the moderation action
    const modAction = { adminId, action, reason, createdAt: new Date() } as any;
    report.actions.push(modAction as any);

    // Perform action on target content
    if (action === 'REMOVE') {
      if (report.targetType === 'REQUEST') {
        const target = await RequestModel.findOne({ id: report.targetId } as Record<string, any>);
        if (target) {
          target.isActive = false;
          await target.save();
        }
      } else if (report.targetType === 'RESPONSE') {
        const target = await ResponseModel.findOne({ id: report.targetId } as Record<string, any>);
        if (target) {
          target.status = 'HIDDEN';
          await target.save();
        }
      }
      report.status = 'ACTION_TAKEN';
    } else if (action === 'RESTORE' || action === 'APPROVE') {
      if (report.targetType === 'REQUEST') {
        const target = await RequestModel.findOne({ id: report.targetId } as Record<string, any>);
        if (target) {
          target.isActive = true;
          await target.save();
        }
      } else if (report.targetType === 'RESPONSE') {
        const target = await ResponseModel.findOne({ id: report.targetId } as Record<string, any>);
        if (target) {
          target.status = 'VISIBLE';
          await target.save();
        }
      }
      report.status = 'DISMISSED';
    } else if (action === 'DISMISS' || action === 'NO_ACTION') {
      report.status = 'DISMISSED';
    } else if (action === 'WARN') {
      // Optionally record a warning; no content change
      report.status = 'ACTION_TAKEN';
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }

    await report.save();

    res.json({ message: 'Action recorded', data: report });
  } catch (error) {
    console.error('Error taking action on report:', error);
    res.status(500).json({ error: 'Failed to take action' });
  }
};
