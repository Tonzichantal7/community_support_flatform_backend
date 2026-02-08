import express from 'express';
import {
  getTotalRequestsByCategory,
  getMostActiveUsers,
  getRequestResolutionRates,
  getSystemUsageStatistics,
  getTimeBasedActivityReport,
  exportAnalyticsToCSV,
  exportAnalyticsToJSON,
  getComprehensiveDashboard
} from '../controller/analyticsController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

/**
 * @swagger
 * /api/admin/analytics/requests-by-category:
 *   get:
 *     summary: Get total service requests grouped by category
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Requests by category retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/admin/analytics/requests-by-category', authenticate, requireAdmin, getTotalRequestsByCategory);

/**
 * @swagger
 * /api/admin/analytics/most-active-users:
 *   get:
 *     summary: Get most active users based on requests and responses
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to return
 *     responses:
 *       200:
 *         description: Most active users retrieved
 */
router.get('/admin/analytics/most-active-users', authenticate, requireAdmin, getMostActiveUsers);

/**
 * @swagger
 * /api/admin/analytics/resolution-rates:
 *   get:
 *     summary: Calculate request resolution rates and average resolution time
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resolution rates retrieved
 */
router.get('/admin/analytics/resolution-rates', authenticate, requireAdmin, getRequestResolutionRates);

/**
 * @swagger
 * /api/admin/analytics/system-usage:
 *   get:
 *     summary: Get overall system usage statistics
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System usage statistics retrieved
 */
router.get('/admin/analytics/system-usage', authenticate, requireAdmin, getSystemUsageStatistics);

/**
 * @swagger
 * /api/admin/analytics/time-based-activity:
 *   get:
 *     summary: Get activity reports based on time periods
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *       - in: query
 *         name: range
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days/weeks/months
 *     responses:
 *       200:
 *         description: Time-based activity retrieved
 */
router.get('/admin/analytics/time-based-activity', authenticate, requireAdmin, getTimeBasedActivityReport);

/**
 * @swagger
 * /api/admin/analytics/export/csv:
 *   get:
 *     summary: Export analytics data to CSV
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [requests, users, responses, reports]
 *         description: Type of data to export
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/admin/analytics/export/csv', authenticate, requireAdmin, exportAnalyticsToCSV);

/**
 * @swagger
 * /api/admin/analytics/export/json:
 *   get:
 *     summary: Export analytics data to JSON
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [requests, users, responses, reports]
 *         description: Type of data to export
 *     responses:
 *       200:
 *         description: JSON file download
 */
router.get('/admin/analytics/export/json', authenticate, requireAdmin, exportAnalyticsToJSON);

/**
 * @swagger
 * /api/admin/analytics/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard with all analytics
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestsByCategory:
 *                   type: array
 *                 mostActiveUsers:
 *                   type: array
 *                 resolutionRates:
 *                   type: object
 *                 systemUsage:
 *                   type: object
 */
router.get('/admin/analytics/dashboard', authenticate, requireAdmin, getComprehensiveDashboard);

export default router;
