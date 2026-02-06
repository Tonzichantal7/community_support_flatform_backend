import { Router } from 'express';
import {
  createRequest,
  getAllRequests,
  getRequestById,
  getMyRequests,
  updateRequest,
  deleteRequest,
  getRequestsByCategory,
  approveRequest,
  rejectRequest,
  offerService,
  getPendingRequests,
  getApprovedRequests,
  getRejectedRequests,
} from '../controller/requestController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

/**
 * @swagger
 * /api/requests/pending:
 *   get:
 *     summary: Get all pending requests available for admin approval by type
 *     tags: [Requests - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [REQUEST, OFFER]
 *         description: Filter pending requests by type
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 *       400:
 *         description: Bad request - type parameter is required
 *       403:
 *         description: Forbidden - only admins can view pending requests
 *       401:
 *         description: Unauthorized
 */
router.get('/pending', authenticate, requireAdmin, getPendingRequests);

/**
 * @swagger
 * /api/requests/approved:
 *   get:
 *     summary: Get all approved requests by type (admin or users)
 *     tags: [Requests - Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [REQUEST, OFFER]
 *         description: Filter approved requests by type
 *     responses:
 *       200:
 *         description: Approved requests retrieved successfully
 *       400:
 *         description: Bad request - type parameter is required
 *       401:
 *         description: Unauthorized
 */
router.get('/approved', authenticate, getApprovedRequests);

/**
 * @swagger
 * /api/requests/rejected:
 *   get:
 *     summary: Get all rejected requests by type (admin only)
 *     tags: [Requests - Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [REQUEST, OFFER]
 *         description: Filter rejected requests by type
 *     responses:
 *       200:
 *         description: Rejected requests retrieved successfully
 *       400:
 *         description: Bad request - type parameter is required
 *       401:
 *         description: Unauthorized
 */
router.get('/rejected', authenticate, getRejectedRequests);

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new request or offer
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - location
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [REQUEST, OFFER]
 *               location:
 *                 type: string
 *               categoryId:
 *                 type: string
 *           example:
 *             title: Need plumbing repair
 *             description: Looking for a plumber to fix leak in kitchen
 *             type: REQUEST
 *             location: Downtown
 *             categoryId: cat_123
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.post('/', authenticate, createRequest);

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get all requests by type (REQUEST or OFFER)
 *     tags: [Requests]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [REQUEST, OFFER]
 *         description: Filter requests by type
 *     responses:
 *       200:
 *         description: Requests retrieved successfully
 *       400:
 *         description: Bad request - type parameter is required
 */
router.get('/', getAllRequests);

/**
 * @swagger
 * /api/requests/my-requests:
 *   get:
 *     summary: Get requests created by current user
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [REQUEST, OFFER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-requests', authenticate, getMyRequests);

/**
 * @swagger
 * /api/requests/category/{categoryId}:
 *   get:
 *     summary: Get requests by category
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [REQUEST, OFFER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Category requests retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/category/:categoryId', getRequestsByCategory);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get a request by ID
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request retrieved successfully
 *       404:
 *         description: Request not found
 */
router.get('/:id', getRequestById);

/**
 * @swagger
 * /api/requests/{id}:
 *   put:
 *     summary: Update a request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [REQUEST, OFFER]
 *               location:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Request updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Request not found
 */
router.put('/:id', authenticate, updateRequest);

/**
 * @swagger
 * /api/requests/{id}:
 *   delete:
 *     summary: Delete a request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Request not found
 */
router.delete('/:id', authenticate, deleteRequest);

/**
 * @swagger
 * /api/requests/offer:
 *   post:
 *     summary: Offer service on an approved request (users only)
 *     tags: [Requests]
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
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: ID of the approved request to offer service on
 *           example:
 *             requestId: "request_uuid_here"
 *     responses:
 *       200:
 *         description: Service offer recorded successfully
 *       400:
 *         description: Bad request - missing requestId or user cannot offer on own request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Request not approved by admin or permission denied
 *       404:
 *         description: Request not found
 */
router.post('/offer', authenticate, offerService);

/**
 * @swagger
 * /api/requests/approve:
 *   patch:
 *     summary: Approve a request (admin only)
 *     tags: [Requests]
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
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: ID of the request to approve
 *           example:
 *             requestId: "request_uuid_here"
 *     responses:
 *       200:
 *         description: Request approved successfully. User can now offer services.
 *       400:
 *         description: Bad request - missing or invalid requestId
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only admins can approve
 *       404:
 *         description: Request not found
 */
router.patch('/approve', authenticate, requireAdmin, approveRequest);

/**
 * @swagger
 * /api/requests/reject:
 *   patch:
 *     summary: Reject a request (admin only)
 *     tags: [Requests]
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
 *               - requestName
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: ID of the request to reject
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: ID of the request to reject
 *               reason:
 *                 type: string
 *                 description: Optional reason for rejection
 *           example:
 *             requestId: "request_uuid_here
 *         description: Bad request - missing or invalid requestId
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only admins can reject
 *       404:
 *         description: Request not found
 */
router.patch('/reject', authenticate, requireAdmin, rejectRequest);

export default router;
