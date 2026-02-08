import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { reportContent, listReports, getReport, takeAction } from '../controller/abuseController';

const router = express.Router();

/**
 * @swagger
 * /api/abuse:
 *   post:
 *     summary: Submit an abuse report for inappropriate content
 *     tags: [Abuse Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *               - reason
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [REQUEST, RESPONSE, USER, OTHER]
 *                 description: Type of content being reported
 *               targetId:
 *                 type: string
 *                 description: ID of the reported content
 *               reason:
 *                 type: string
 *                 description: Reason for reporting
 *               details:
 *                 type: string
 *                 description: Additional details about the report
 *           example:
 *             targetType: RESPONSE
 *             targetId: resp_123
 *             reason: Inappropriate language
 *             details: Contains offensive content
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - user not authenticated
 *       404:
 *         description: Target content not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, reportContent);

/**
 * @swagger
 * /api/abuse/admin:
 *   get:
 *     summary: List all abuse reports (admin only)
 *     tags: [Abuse Reporting - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, UNDER_REVIEW, ACTION_TAKEN, DISMISSED]
 *         description: Filter by report status
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [REQUEST, RESPONSE, USER, OTHER]
 *         description: Filter by target content type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Number of reports per page (max 100)
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         description: Server error
 */
router.get('/admin', authenticate, requireAdmin, listReports);

/**
 * @swagger
 * /api/abuse/admin/{id}:
 *   get:
 *     summary: Get details of a specific abuse report
 *     tags: [Abuse Reporting - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *       400:
 *         description: Bad request - report id required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot view this report
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.get('/admin/:id', authenticate, requireAdmin, getReport);

/**
 * @swagger
 * /api/abuse/admin/{id}/action:
 *   post:
 *     summary: Take moderation action on an abuse report
 *     tags: [Abuse Reporting - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [REMOVE, RESTORE, DISMISS, WARN, NO_ACTION]
 *                 description: Moderation action to take
 *               reason:
 *                 type: string
 *                 description: Reason for the action
 *           example:
 *             action: REMOVE
 *             reason: Violates community guidelines
 *     responses:
 *       200:
 *         description: Action recorded successfully
 *       400:
 *         description: Bad request - invalid action or missing fields
 *       401:
 *         description: Unauthorized - admin not authenticated
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.post('/admin/:id/action', authenticate, requireAdmin, takeAction);

export default router;
