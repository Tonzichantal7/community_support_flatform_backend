import { Response } from 'express';
import { AuthRequest } from '../types';
import Request from '../models/Request';
import Category from '../models/Category';

/**
 * Get all pending requests available for admin approval
 * Filtered by type only
 */
export const getPendingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const userRole = req.user?.role;

    // Check if user is admin
    if (userRole !== 'admin') {
      res.status(403).json({ error: 'Only admins can view pending requests' });
      return;
    }

    // Validate type is provided
    if (!type || typeof type !== 'string' || !['REQUEST', 'OFFER'].includes(type)) {
      res.status(400).json({ error: 'Type parameter is required and must be either REQUEST or OFFER' });
      return;
    }

    // Build filter for pending/unapproved requests
    const filter: Record<string, any> = { 
      isActive: true, 
      adminApproved: false, 
      status: 'PENDING',
      type: type
    };

    // Get all pending requests matching the type
    const pendingRequests = await Request.find(filter)
      .select('id userId title description type location categoryId createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with category names
    const enrichedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        const category = await Category.findOne({ id: request.categoryId }).select('name').lean();
        return {
          ...request,
          categoryName: category?.name || 'Unknown Category',
        };
      })
    );

    res.status(200).json({
      message: 'Pending requests retrieved successfully',
      requests: enrichedRequests,
      count: enrichedRequests.length,
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve pending requests' });
  }
};

/**
 * Get all approved requests available for service offering
 * Filtered by type only
 */
export const getApprovedRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    // Validate type is provided
    if (!type || typeof type !== 'string' || !['REQUEST', 'OFFER'].includes(type)) {
      res.status(400).json({ error: 'Type parameter is required and must be either REQUEST or OFFER' });
      return;
    }

    // Build filter for approved requests
    const filter: Record<string, any> = { 
      isActive: true, 
      adminApproved: true, 
      status: 'APPROVED',
      type: type
    };

    // Get all approved requests matching the type
    const approvedRequests = await Request.find(filter)
      .select('id userId title description type location categoryId createdAt approvedAt')
      .sort({ approvedAt: -1 })
      .lean();

    // Enrich with category names
    const enrichedRequests = await Promise.all(
      approvedRequests.map(async (request) => {
        const category = await Category.findOne({ id: request.categoryId }).select('name').lean();
        return {
          ...request,
          categoryName: category?.name || 'Unknown Category',
        };
      })
    );

    res.status(200).json({
      message: 'Approved requests retrieved successfully',
      requests: enrichedRequests,
      count: enrichedRequests.length,
    });
  } catch (error) {
    console.error('Get approved requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve approved requests' });
  }
};

/**
 * Get all rejected requests
 * Filtered by type only
 */
export const getRejectedRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    // Validate type is provided
    if (!type || typeof type !== 'string' || !['REQUEST', 'OFFER'].includes(type)) {
      res.status(400).json({ error: 'Type parameter is required and must be either REQUEST or OFFER' });
      return;
    }

    // Build filter for rejected requests
    const filter: Record<string, any> = { 
      isActive: true, 
      status: 'REJECTED',
      type: type
    };

    // Get all rejected requests matching the type
    const rejectedRequests = await Request.find(filter)
      .select('id userId title description type location categoryId createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    // Enrich with category names
    const enrichedRequests = await Promise.all(
      rejectedRequests.map(async (request) => {
        const category = await Category.findOne({ id: request.categoryId }).select('name').lean();
        return {
          ...request,
          categoryName: category?.name || 'Unknown Category',
        };
      })
    );

    res.status(200).json({
      message: 'Rejected requests retrieved successfully',
      requests: enrichedRequests,
      count: enrichedRequests.length,
    });
  } catch (error) {
    console.error('Get rejected requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve rejected requests' });
  }
};

/**
 * Create a new request/offer
 */
export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, type, location, categoryId } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!title || !description || !type || !location || !categoryId) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate type
    if (!['REQUEST', 'OFFER'].includes(type)) {
      res.status(400).json({ error: 'Type must be either REQUEST or OFFER' });
      return;
    }

    // Validate that category exists
    const category = await Category.findOne({ id: categoryId, isActive: true });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Create new request
    const newRequest = new Request({
      userId,
      categoryId,
      title,
      description,
      type,
      location,
      status: 'PENDING',
      isActive: true,
    });

    await newRequest.save();

    res.status(201).json({
      message: 'Request created successfully',
      request: newRequest,
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
};

/**
 * Get all requests filtered by type only
 */
export const getAllRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    // Validate type is provided
    if (!type || typeof type !== 'string' || !['REQUEST', 'OFFER'].includes(type)) {
      res.status(400).json({ error: 'Type parameter is required and must be either REQUEST or OFFER' });
      return;
    }

    // Build filter object - only filter by type and isActive
    const filter: Record<string, any> = { 
      isActive: true,
      type: type
    };

    // Get all requests matching the type
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: 'Requests retrieved successfully',
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve requests' });
  }
};

/**
 * Get a single request by ID
 */
export const getRequestById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate id is a string
    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid request ID' });
      return;
    }

    const request = await Request.findOne({ id, isActive: true }).lean();

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    res.status(200).json({
      message: 'Request retrieved successfully',
      request,
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to retrieve request' });
  }
};

/**
 * Get requests created by current user
 */
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { type, status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    // Build filter
    const filter: Record<string, any> = { userId, isActive: true };

    if (type && typeof type === 'string' && ['REQUEST', 'OFFER'].includes(type)) {
      filter.type = type;
    }

    if (status && typeof status === 'string' && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      filter.status = status;
    }

    // Get total count
    const total = await Request.countDocuments(filter);

    // Get paginated requests
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      message: 'Your requests retrieved successfully',
      requests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve requests' });
  }
};

/**
 * Update a request
 */
export const updateRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, type, location, categoryId, status } = req.body;
    const userId = req.user?.id;

    // Validate id is a string
    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid request ID' });
      return;
    }

    // Find request
    const request = await Request.findOne({ id, isActive: true });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Check ownership
    if (request.userId !== userId) {
      res.status(403).json({ error: 'You do not have permission to update this request' });
      return;
    }

    // Validate type if provided
    if (type && !['REQUEST', 'OFFER'].includes(type)) {
      res.status(400).json({ error: 'Type must be either REQUEST or OFFER' });
      return;
    }

    // Validate category if provided
    if (categoryId) {
      const category = await Category.findOne({ id: categoryId, isActive: true });
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      request.categoryId = categoryId;
    }

    // Update fields
    if (title) request.title = title;
    if (description) request.description = description;
    if (type) request.type = type;
    if (location) request.location = location;
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      request.status = status;
    }

    await request.save();

    res.status(200).json({
      message: 'Request updated successfully',
      request,
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
};

/**
 * Delete a request (soft delete)
 */
export const deleteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Validate id is a string
    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid request ID' });
      return;
    }

    // Find request
    const request = await Request.findOne({ id, isActive: true });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Check ownership
    if (request.userId !== userId) {
      res.status(403).json({ error: 'You do not have permission to delete this request' });
      return;
    }

    // Soft delete
    request.isActive = false;
    await request.save();

    res.status(200).json({
      message: 'Request deleted successfully',
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
};

/**
 * User offers service on an approved request
 * Only allowed if request is approved by admin and canOfferService is true
 */
export const offerService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.body;
    const userId = req.user?.id;

    // Validate requestId is provided and is a string
    if (!requestId || typeof requestId !== 'string') {
      res.status(400).json({ error: 'Request ID is required and must be a string' });
      return;
    }

    // Find request
    const request = await Request.findOne({ id: requestId, isActive: true });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Check if request is approved by admin
    if (!request.adminApproved) {
      res.status(403).json({ error: 'This request has not been approved by admin yet. You cannot offer services.' });
      return;
    }

    // Check if user can offer service on this request
    if (!request.canOfferService) {
      res.status(403).json({ error: 'You do not have permission to offer service on this request.' });
      return;
    }

    // Check if user is not the request creator
    if (request.userId === userId) {
      res.status(400).json({ error: 'You cannot offer service on your own request' });
      return;
    }

    res.status(200).json({
      message: 'Service offer recorded successfully',
      request: {
        id: request.id,
        title: request.title,
        description: request.description,
        location: request.location,
        adminApproved: request.adminApproved,
        canOfferService: request.canOfferService,
      },
    });
  } catch (error) {
    console.error('Offer service error:', error);
    res.status(500).json({ error: 'Failed to offer service' });
  }
};

/**
 * Get requests by category
 */
/**
 * Get requests by category
 */
export const getRequestsByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { type, status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    // Validate categoryId is a string
    if (typeof categoryId !== 'string') {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    // Verify category exists
    const category = await Category.findOne({ id: categoryId, isActive: true });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Build filter
    const filter: Record<string, any> = { categoryId, isActive: true };

    if (type && typeof type === 'string' && ['REQUEST', 'OFFER'].includes(type)) {
      filter.type = type;
    }

    if (status && typeof status === 'string' && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      filter.status = status;
    }

    // Get total count
    const total = await Request.countDocuments(filter);

    // Get paginated requests
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      message: 'Requests for category retrieved successfully',
      category: category.name,
      requests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get requests by category error:', error);
    res.status(500).json({ error: 'Failed to retrieve requests' });
  }
};

/**
 * Approve a request (admin only)
 * Sets status to APPROVED, marks adminApproved as true, and allows user to offer service
 */
export const approveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.body;
    const adminId = req.user?.id;
    const userRole = req.user?.role;

    // Validate requestId is provided and is a string
    if (!requestId || typeof requestId !== 'string') {
      res.status(400).json({ error: 'Request ID is required and must be a string' });
      return;
    }

    // Check if user is admin
    if (userRole !== 'admin') {
      res.status(403).json({ error: 'Only admins can approve requests' });
      return;
    }

    // Find and update request
    const request = await Request.findOneAndUpdate(
      { id: requestId, isActive: true },
      {
        status: 'APPROVED',
        adminApproved: true,
        canOfferService: true,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    res.status(200).json({
      message: 'Request approved successfully. User can now offer services.',
      request,
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
};

/**
 * Reject a request (admin only)
 * Sets status to REJECTED and prevents user from offering service
 */
export const rejectRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { requestId, reason } = req.body;
    const userRole = req.user?.role;

    // Validate requestId is provided and is a string
    if (!requestId || typeof requestId !== 'string') {
      res.status(400).json({ error: 'Request ID is required and must be a string' });
      return;
    }

    // Check if user is admin
    if (userRole !== 'admin') {
      res.status(403).json({ error: 'Only admins can reject requests' });
      return;
    }

    // Find and update request
    const request = await Request.findOneAndUpdate(
      { id: requestId, isActive: true },
      {
        status: 'REJECTED',
        adminApproved: false,
        canOfferService: false,
      },
      { new: true }
    );

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    res.status(200).json({
      message: 'Request rejected successfully. User cannot offer services on this request.',
      request,
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
};
