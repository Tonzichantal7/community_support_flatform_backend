import { Response } from 'express';
import User from '../models/User';
import ServiceRequest from '../models/Request';
import ServiceResponse from '../models/Response';
import AbuseReport from '../models/AbuseReport';
import Category from '../models/Category';
import { AuthRequest } from '../types';
import { Parser } from 'json2csv';
import { calculatePercentage, getDateRange, formatDuration, getCSVFields } from '../utils/analyticsHelper';

/**
 * Get total service requests grouped by category
 * GET /api/admin/analytics/requests-by-category
 */
export const getTotalRequestsByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestsByCategory = await ServiceRequest.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: 'id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$category.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({ requestsByCategory });
  } catch (error) {
    console.error('Error fetching requests by category:', error);
    res.status(500).json({ message: 'Failed to fetch requests by category' });
  }
};

/**
 * Get most active users based on requests created and responses given
 * GET /api/admin/analytics/most-active-users?limit=10
 */
export const getMostActiveUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query as Record<string, string>;
    const limitNum = parseInt(limit, 10);

    const requestCounts = await ServiceRequest.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$userId', requestCount: { $sum: 1 } } }
    ]);

    const responseCounts = await ServiceResponse.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$userId', responseCount: { $sum: 1 } } }
    ]);

    const activityMap = new Map<string, { requestCount: number; responseCount: number }>();

    requestCounts.forEach(item => {
      activityMap.set(item._id, { requestCount: item.requestCount, responseCount: 0 });
    });

    responseCounts.forEach(item => {
      const existing = activityMap.get(item._id) || { requestCount: 0, responseCount: 0 };
      activityMap.set(item._id, { ...existing, responseCount: item.responseCount });
    });

    const activities = Array.from(activityMap.entries()).map(([userId, counts]) => ({
      userId,
      requestCount: counts.requestCount,
      responseCount: counts.responseCount,
      totalActivity: counts.requestCount + counts.responseCount
    }));

    activities.sort((a, b) => b.totalActivity - a.totalActivity);
    const topActivities = activities.slice(0, limitNum);

    const mostActiveUsers = await Promise.all(
      topActivities.map(async (activity) => {
        const user = await User.findOne({ id: activity.userId }).lean();
        return {
          userId: activity.userId,
          name: user?.name || 'Unknown',
          email: user?.email || 'Unknown',
          requestCount: activity.requestCount,
          responseCount: activity.responseCount,
          totalActivity: activity.totalActivity
        };
      })
    );

    res.status(200).json({ mostActiveUsers });
  } catch (error) {
    console.error('Error fetching most active users:', error);
    res.status(500).json({ message: 'Failed to fetch most active users' });
  }
};

/**
 * Calculate request resolution rates
 * GET /api/admin/analytics/resolution-rates
 */
export const getRequestResolutionRates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalRequests = await ServiceRequest.countDocuments({ isActive: true });
    const approvedRequests = await ServiceRequest.countDocuments({ status: 'APPROVED', isActive: true });
    const rejectedRequests = await ServiceRequest.countDocuments({ status: 'REJECTED', isActive: true });
    const pendingRequests = await ServiceRequest.countDocuments({ status: 'PENDING', isActive: true });

    const resolutionRate = calculatePercentage(approvedRequests + rejectedRequests, totalRequests);

    const resolvedRequests = await ServiceRequest.find({
      status: { $in: ['APPROVED', 'REJECTED'] },
      isActive: true,
      approvedAt: { $exists: true }
    }).lean();

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    resolvedRequests.forEach(request => {
      if (request.approvedAt && request.createdAt) {
        totalResolutionTime += new Date(request.approvedAt).getTime() - new Date(request.createdAt).getTime();
        resolvedCount++;
      }
    });

    const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
    const averageResolutionTime = formatDuration(avgResolutionTime);

    res.status(200).json({
      totalRequests,
      approvedRequests,
      rejectedRequests,
      pendingRequests,
      resolutionRate,
      averageResolutionTime
    });
  } catch (error) {
    console.error('Error fetching resolution rates:', error);
    res.status(500).json({ message: 'Failed to fetch resolution rates' });
  }
};

/**
 * Get overall system usage statistics
 * GET /api/admin/analytics/system-usage
 */
export const getSystemUsageStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeRequestUsers = await ServiceRequest.distinct('userId', { createdAt: { $gte: thirtyDaysAgo }, isActive: true });
    const activeResponseUsers = await ServiceResponse.distinct('userId', { createdAt: { $gte: thirtyDaysAgo }, isActive: true });
    const activeUsersSet = new Set([...activeRequestUsers, ...activeResponseUsers]);
    const activeUsers = activeUsersSet.size;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

    const totalRequests = await ServiceRequest.countDocuments({ isActive: true });
    const totalResponses = await ServiceResponse.countDocuments({ isActive: true });
    const totalAbuseReports = await AbuseReport.countDocuments({ isActive: true });

    res.status(200).json({
      users: {
        total: totalUsers,
        admins: totalAdmins,
        regularUsers: totalRegularUsers,
        activeUsers,
        newThisMonth
      },
      requests: { total: totalRequests },
      responses: { total: totalResponses },
      abuseReports: { total: totalAbuseReports }
    });
  } catch (error) {
    console.error('Error fetching system usage statistics:', error);
    res.status(500).json({ message: 'Failed to fetch system usage statistics' });
  }
};

/**
 * Get activity reports based on time periods
 * GET /api/admin/analytics/time-based-activity?period=daily&range=7
 */
export const getTimeBasedActivityReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = 'daily', range = '7' } = req.query as Record<string, string>;
    const rangeNum = parseInt(range, 10);
    const periodType = period as 'daily' | 'weekly' | 'monthly';

    const { startDate, endDate } = getDateRange(periodType, rangeNum);

    const requestsByDate = await ServiceRequest.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, isActive: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const responsesByDate = await ServiceResponse.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, isActive: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const usersByDate = await User.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dataMap = new Map<string, { requests: number; responses: number; newUsers: number }>();

    requestsByDate.forEach(item => {
      dataMap.set(item._id, { requests: item.count, responses: 0, newUsers: 0 });
    });

    responsesByDate.forEach(item => {
      const existing = dataMap.get(item._id) || { requests: 0, responses: 0, newUsers: 0 };
      dataMap.set(item._id, { ...existing, responses: item.count });
    });

    usersByDate.forEach(item => {
      const existing = dataMap.get(item._id) || { requests: 0, responses: 0, newUsers: 0 };
      dataMap.set(item._id, { ...existing, newUsers: item.count });
    });

    const data = Array.from(dataMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({ period: periodType, data });
  } catch (error) {
    console.error('Error fetching time-based activity:', error);
    res.status(500).json({ message: 'Failed to fetch time-based activity' });
  }
};

/**
 * Export analytics data to CSV
 * GET /api/admin/analytics/export/csv?type=requests
 */
export const exportAnalyticsToCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query as Record<string, string>;

    if (!type) {
      res.status(400).json({ message: 'Type parameter is required' });
      return;
    }

    let data: any[] = [];

    switch (type) {
      case 'requests':
        data = await ServiceRequest.find({ isActive: true }).lean();
        break;
      case 'users':
        data = await User.find().lean();
        break;
      case 'responses':
        data = await ServiceResponse.find({ isActive: true }).lean();
        break;
      case 'reports':
        data = await AbuseReport.find({ isActive: true }).lean();
        break;
      default:
        res.status(400).json({ message: 'Invalid type parameter' });
        return;
    }

    const fields = getCSVFields(type);
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    res.status(500).json({ message: 'Failed to export data to CSV' });
  }
};

/**
 * Export analytics data to JSON
 * GET /api/admin/analytics/export/json?type=requests
 */
export const exportAnalyticsToJSON = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query as Record<string, string>;

    if (!type) {
      res.status(400).json({ message: 'Type parameter is required' });
      return;
    }

    let data: any[] = [];

    switch (type) {
      case 'requests':
        data = await ServiceRequest.find({ isActive: true }).lean();
        break;
      case 'users':
        data = await User.find().lean();
        break;
      case 'responses':
        data = await ServiceResponse.find({ isActive: true }).lean();
        break;
      case 'reports':
        data = await AbuseReport.find({ isActive: true }).lean();
        break;
      default:
        res.status(400).json({ message: 'Invalid type parameter' });
        return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.json"`);
    res.status(200).json({ data, exportedAt: new Date(), type });
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    res.status(500).json({ message: 'Failed to export data to JSON' });
  }
};

/**
 * Get all analytics in one call for admin dashboard
 * GET /api/admin/analytics/dashboard
 */
export const getComprehensiveDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestsByCategory = await ServiceRequest.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: 'id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$category.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const requestCounts = await ServiceRequest.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$userId', requestCount: { $sum: 1 } } }
    ]);

    const responseCounts = await ServiceResponse.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$userId', responseCount: { $sum: 1 } } }
    ]);

    const activityMap = new Map<string, { requestCount: number; responseCount: number }>();
    requestCounts.forEach(item => {
      activityMap.set(item._id, { requestCount: item.requestCount, responseCount: 0 });
    });
    responseCounts.forEach(item => {
      const existing = activityMap.get(item._id) || { requestCount: 0, responseCount: 0 };
      activityMap.set(item._id, { ...existing, responseCount: item.responseCount });
    });

    const activities = Array.from(activityMap.entries())
      .map(([userId, counts]) => ({
        userId,
        requestCount: counts.requestCount,
        responseCount: counts.responseCount,
        totalActivity: counts.requestCount + counts.responseCount
      }))
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, 5);

    const mostActiveUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await User.findOne({ id: activity.userId }).lean();
        return {
          userId: activity.userId,
          name: user?.name || 'Unknown',
          email: user?.email || 'Unknown',
          requestCount: activity.requestCount,
          responseCount: activity.responseCount,
          totalActivity: activity.totalActivity
        };
      })
    );

    const totalRequests = await ServiceRequest.countDocuments({ isActive: true });
    const approvedRequests = await ServiceRequest.countDocuments({ status: 'APPROVED', isActive: true });
    const rejectedRequests = await ServiceRequest.countDocuments({ status: 'REJECTED', isActive: true });
    const resolutionRate = calculatePercentage(approvedRequests + rejectedRequests, totalRequests);

    const totalUsers = await User.countDocuments();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeRequestUsers = await ServiceRequest.distinct('userId', { createdAt: { $gte: thirtyDaysAgo }, isActive: true });
    const activeResponseUsers = await ServiceResponse.distinct('userId', { createdAt: { $gte: thirtyDaysAgo }, isActive: true });
    const activeUsersSet = new Set([...activeRequestUsers, ...activeResponseUsers]);

    res.status(200).json({
      requestsByCategory,
      mostActiveUsers,
      resolutionRates: {
        totalRequests,
        approvedRequests,
        rejectedRequests,
        resolutionRate
      },
      systemUsage: {
        users: { total: totalUsers, activeUsers: activeUsersSet.size },
        requests: { total: totalRequests }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};
