import express from 'express';
import { banUser, unbanUser, getAllUsers, updateUserRole, getUserById } from '../controller/adminController';
import { getModerationHistory, getTargetHistory, getModeratorActivity } from '../controller/moderationHistoryController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users', authenticate, requireAdmin, getAllUsers);

router.get('/users/:userId', authenticate, getUserById);

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, helper, admin]
 *           example:
 *             role: admin
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role
 *       404:
 *         description: User not found
 */
router.put('/users/:userId/role', authenticate, requireAdmin, updateUserRole);

/**
 * @swagger
 * /api/admin/users/{userId}/ban:
 *   post:
 *     summary: Ban a user (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - banType
 *               - reason
 *             properties:
 *               banType:
 *                 type: string
 *                 enum: [temporary, permanent]
 *               reason:
 *                 type: string
 *               duration:
 *                 type: number
 *                 description: Duration in days (required for temporary bans)
 *           example:
 *             banType: temporary
 *             reason: Violation of community guidelines
 *             duration: 7
 *     responses:
 *       200:
 *         description: User banned successfully
 *       403:
 *         description: Cannot ban admin users
 *       404:
 *         description: User not found
 */
router.post('/users/:userId/ban', authenticate, requireAdmin, banUser);

/**
 * @swagger
 * /api/admin/users/{userId}/unban:
 *   post:
 *     summary: Unban a user (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unbanned successfully
 *       404:
 *         description: User not found
 */
router.post('/users/:userId/unban', authenticate, requireAdmin, unbanUser);

/**
 * @swagger
 * /api/admin/moderation-history:
 *   get:
 *     summary: Get moderation history (Admin only)
 *     tags: [Admin - Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Moderation history retrieved
 */
router.get('/moderation-history', authenticate, requireAdmin, getModerationHistory);

router.get('/moderation-history/:targetType/:targetId', authenticate, requireAdmin, getTargetHistory);
router.get('/moderators/:moderatorId/activity', authenticate, requireAdmin, getModeratorActivity);

export default router;
