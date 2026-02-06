import express from 'express';
import {
  createResponse,
  getResponsesByRequest,
  getResponsesByRequestAuth,
  getResponseById,
  updateResponse,
  deleteResponse,
  hideResponse,
  showResponse,
  getResponsesByUser,
} from '../controller/responseController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

/**
 * @swagger
 * /api/responses:
 *   post:
 *     summary: Create a new response to a request
 *     description: Add a comment/response to a service request
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *               - content
 *             properties:
 *               requestId:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               content:
 *                 type: string
 *                 example: "I can help you with this service"
 *     responses:
 *       201:
 *         description: Response created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Request not found
 */
router.post('/', authenticate, createResponse);

/**
 * @swagger
 * /api/responses/request/{requestId}:
 *   get:
 *     summary: Get all visible responses for a request (public)
 *     description: Retrieve all visible responses/comments for a specific service request. Hidden responses are not included.
 *     tags: [Responses]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Responses retrieved successfully
 *       404:
 *         description: Request not found
 */
router.get('/request/:requestId', getResponsesByRequest);

/**
 * @swagger
 * /api/responses/request/{requestId}/auth:
 *   get:
 *     summary: Get all responses for a request with authentication context
 *     description: Retrieve all responses with visibility rules applied based on user role. Hidden responses visible to response owner, request owner, or admin.
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: All responses retrieved successfully with visibility rules applied
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Request not found
 */
router.get('/request/:requestId/auth', authenticate, getResponsesByRequestAuth);

/**
 * @swagger
 * /api/responses/{id}:
 *   get:
 *     summary: Get a specific response by ID
 *     description: Retrieve details of a single response
 *     tags: [Responses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Response retrieved successfully
 *       404:
 *         description: Response not found
 */
router.get('/:id', getResponseById);

/**
 * @swagger
 * /api/responses/{id}:
 *   put:
 *     summary: Update a response (owner only)
 *     description: Update the content of your own response
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated response content"
 *     responses:
 *       200:
 *         description: Response updated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this response
 *       404:
 *         description: Response not found
 */
router.put('/:id', authenticate, updateResponse);

/**
 * @swagger
 * /api/responses/{id}:
 *   delete:
 *     summary: Delete a response (owner or admin only)
 *     description: Delete/remove a response (soft delete)
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Response deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this response
 *       404:
 *         description: Response not found
 */
router.delete('/:id', authenticate, deleteResponse);

/**
 * @swagger
 * /api/responses/{id}/hide:
 *   patch:
 *     summary: Hide a response (admin only)
 *     description: Hide a response from public view (admin only)
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Response hidden successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only admin can hide responses
 *       404:
 *         description: Response not found
 */
router.patch('/:id/hide', authenticate, requireAdmin, hideResponse);

/**
 * @swagger
 * /api/responses/{id}/show:
 *   patch:
 *     summary: Show a response (admin only)
 *     description: Unhide a previously hidden response (admin only)
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Response shown successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only admin can show responses
 *       404:
 *         description: Response not found
 */
router.patch('/:id/show', authenticate, requireAdmin, showResponse);

/**
 * @swagger
 * /api/responses/my-responses:
 *   get:
 *     summary: Get all responses by current user
 *     description: Retrieve all responses posted by the authenticated user
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User responses retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-responses', authenticate, getResponsesByUser);

export default router;
