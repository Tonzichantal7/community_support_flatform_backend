import { Response } from 'express';
import AbuseReport from '../models/AbuseReport';
import ModerationHistory from '../models/ModerationHistory';
import ServiceRequest from '../models/Request';
import { AuthRequest } from '../types';
import { sendRequestFlaggedNotification, sendAdminAbuseReportNotification } from '../services/emailService';

/**
 * Submit a new abuse report
 * POST /api/abuse-reports
 */
export const submitAbuseReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { requestId, responseId, reason, description } = req.body;
    const reporterId = req.user?.id;

    if (!reporterId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const targetType = requestId ? 'REQUEST' : 'RESPONSE';
    const targetId = requestId || responseId;

    const report = await AbuseReport.create({
      reporterId,
      targetType,
      targetId,
      reason,
      details: description,
      status: 'OPEN'
    });

    // If reporting a request, notify the request owner (non-blocking)
    if (targetType === 'REQUEST') {
      ServiceRequest.findOne({ id: targetId }).then(request => {
        if (request) {
          sendRequestFlaggedNotification(
            request.userId,
            request.title,
            reason,
            request.id
          ).catch(err => console.error('Flagged notification failed:', err));
        }
      }).catch(err => console.error('Error finding request:', err));
    }

    // Notify all admins about the new report (non-blocking)
    sendAdminAbuseReportNotification(
      reporterId,
      reason,
      description || '',
      targetType,
      report.id
    ).catch(err => console.error('Admin notification failed:', err));

    res.status(201).json({
      message: 'Abuse report submitted successfully',
      reportId: report.id
    });
  } catch (error) {
    console.error('Error submitting abuse report:', error);
    res.status(500).json({ message: 'Failed to submit abuse report' });
  }
};

/**
 * Get all abuse reports with pagination and filtering (ADMIN ONLY)
 * GET /api/admin/abuse-reports?page=1&limit=20&status=OPEN
 */
export const getAllAbuseReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const filter: any = { isActive: true };
    if (status) filter.status = status;

    const reports = await AbuseReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await AbuseReport.countDocuments(filter);

    res.status(200).json({
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching abuse reports:', error);
    res.status(500).json({ message: 'Failed to fetch abuse reports' });
  }
};

/**
 * Get single abuse report by ID
 * GET /api/abuse-reports/:reportId
 */
export const getAbuseReportById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reportId = req.params.reportId as string;

    const report = await AbuseReport.findOne({ id: reportId, isActive: true });
    if (!report) {
      res.status(404).json({ message: 'Abuse report not found' });
      return;
    }

    res.status(200).json({ report });
  } catch (error) {
    console.error('Error fetching abuse report:', error);
    res.status(500).json({ message: 'Failed to fetch abuse report' });
  }
};

/**
 * Get current user's submitted reports
 * GET /api/abuse-reports/my
 */
export const getMyAbuseReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const reports = await AbuseReport.find({ reporterId: userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ reports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Failed to fetch your reports' });
  }
};

/**
 * Mark abuse report as resolved (ADMIN ONLY)
 * PUT /api/admin/abuse-reports/:reportId/resolve
 */
export const resolveAbuseReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reportId = req.params.reportId as string;
    const { notes } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const report = await AbuseReport.findOne({ id: reportId, isActive: true });
    if (!report) {
      res.status(404).json({ message: 'Abuse report not found' });
      return;
    }

    if (report.status === 'DISMISSED') {
      res.status(400).json({ message: 'Report already resolved' });
      return;
    }

    report.status = 'DISMISSED';
    await report.save();

    await ModerationHistory.create({
      action: 'resolve_report',
      targetType: 'report',
      targetId: reportId as string,
      moderatorId: adminId as string,
      reason: notes || 'Report marked as resolved'
    });

    res.status(200).json({
      message: 'Abuse report resolved successfully',
      report
    });
  } catch (error) {
    console.error('Error resolving abuse report:', error);
    res.status(500).json({ message: 'Failed to resolve abuse report' });
  }
};

/**
 * Reopen a resolved report (ADMIN ONLY)
 * PUT /api/admin/abuse-reports/:reportId/reopen
 */
export const reopenAbuseReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reportId = req.params.reportId as string;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const report = await AbuseReport.findOne({ id: reportId, isActive: true });
    if (!report) {
      res.status(404).json({ message: 'Abuse report not found' });
      return;
    }

    if (report.status === 'OPEN') {
      res.status(400).json({ message: 'Report is already open' });
      return;
    }

    report.status = 'OPEN';
    await report.save();

    await ModerationHistory.create({
      action: 'dismiss_report',
      targetType: 'report',
      targetId: reportId as string,
      moderatorId: adminId as string,
      reason: 'Report reopened'
    });

    res.status(200).json({
      message: 'Abuse report reopened successfully',
      report
    });
  } catch (error) {
    console.error('Error reopening abuse report:', error);
    res.status(500).json({ message: 'Failed to reopen abuse report' });
  }
};

/**
 * Get abuse report statistics (ADMIN ONLY)
 * GET /api/admin/abuse-reports/stats
 */
export const getAbuseReportStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalReports = await AbuseReport.countDocuments({ isActive: true });
    const openReports = await AbuseReport.countDocuments({ status: 'OPEN', isActive: true });
    const resolvedReports = await AbuseReport.countDocuments({ status: 'DISMISSED', isActive: true });

    const topReasons = await AbuseReport.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const recentReports = await AbuseReport.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      totalReports,
      openReports,
      resolvedReports,
      topReasons,
      recentReports
    });
  } catch (error) {
    console.error('Error fetching abuse report stats:', error);
    res.status(500).json({ message: 'Failed to fetch abuse report statistics' });
  }
};
