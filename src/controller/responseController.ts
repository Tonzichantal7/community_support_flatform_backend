import { Request, Response } from 'express';
import ResponseModel, { IResponse } from '../models/Response';
import RequestModel from '../models/Request';
import { AuthRequest } from '../types';

// Create a new response to a request
export const createResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId, content } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!requestId || !content || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'requestId and content are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate request exists and is active
    const request = await RequestModel.findOne({ id: requestId as string, isActive: true } as Record<string, any>);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Create response
    const newResponse = new ResponseModel({
      requestId,
      userId,
      content,
      status: 'VISIBLE',
      isActive: true,
    });

    await newResponse.save();

    res.status(201).json({
      message: 'Response created successfully',
      data: newResponse,
    });
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ error: 'Failed to create response' });
  }
};

// Get all responses for a specific request
export const getResponsesByRequest = async (req: Request, res: Response) => {
  try {
    const requestId = req.params.requestId;

    if (typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Invalid requestId' });
    }

    // Validate request exists
    const request = await RequestModel.findOne({ id: requestId, isActive: true } as Record<string, any>);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Fetch visible responses only for public view
    const responses = await ResponseModel.find({ requestId, isActive: true, status: 'VISIBLE' } as Record<string, any>).sort({ createdAt: -1 });

    res.json({
      message: 'Responses retrieved successfully',
      data: responses,
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
};

// Get all responses for a request including hidden ones (with auth context)
export const getResponsesByRequestAuth = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Invalid requestId' });
    }

    // Validate request exists
    const request = await RequestModel.findOne({ id: requestId, isActive: true } as Record<string, any>);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Fetch all responses for authenticated user
    const allResponses = await ResponseModel.find({ requestId, isActive: true } as Record<string, any>).sort({ createdAt: -1 });

    // Filter based on visibility and user role
    const filteredResponses = allResponses.filter((response) => {
      // Visible to everyone
      if (response.status === 'VISIBLE') {
        return true;
      }
      // Hidden responses visible only to: response owner, request owner, or admin
      if (response.status === 'HIDDEN') {
        return response.userId === userId || request.userId === userId || userRole === 'admin';
      }
      return false;
    });

    res.json({
      message: 'Responses retrieved successfully',
      data: filteredResponses,
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
};

// Get a specific response by ID
export const getResponseById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid response ID' });
    }

    const response = await ResponseModel.findOne({ id, isActive: true, status: 'VISIBLE' } as Record<string, any>);

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({
      message: 'Response retrieved successfully',
      data: response,
    });
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Failed to fetch response' });
  }
};

// Update a response (owner only)
export const updateResponse = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    if (!userId || typeof id !== 'string') {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find response
    const response = await ResponseModel.findOne({ id, isActive: true } as Record<string, any>);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Check ownership
    if (response.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this response' });
    }

    // Update content only
    response.content = content;
    await response.save();

    res.json({
      message: 'Response updated successfully',
      data: response,
    });
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
};

// Delete a response (owner or admin only, soft delete)
export const deleteResponse = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || typeof id !== 'string') {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find response
    const response = await ResponseModel.findOne({ id, isActive: true } as Record<string, any>);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Check if owner or admin
    if (response.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this response' });
    }

    // Soft delete
    response.isActive = false;
    await response.save();

    res.json({
      message: 'Response deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
};

// Hide response (admin only)
export const hideResponse = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const userRole = req.user?.role;

    if (userRole !== 'admin' || typeof id !== 'string') {
      return res.status(403).json({ error: 'Only admin can hide responses' });
    }

    // Find response
    const response = await ResponseModel.findOne({ id, isActive: true } as Record<string, any>);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Hide response
    response.status = 'HIDDEN';
    await response.save();

    res.json({
      message: 'Response hidden successfully',
      data: response,
    });
  } catch (error) {
    console.error('Error hiding response:', error);
    res.status(500).json({ error: 'Failed to hide response' });
  }
};

// Show response (admin only)
export const showResponse = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const userRole = req.user?.role;

    if (userRole !== 'admin' || typeof id !== 'string') {
      return res.status(403).json({ error: 'Only admin can show responses' });
    }

    // Find response
    const response = await ResponseModel.findOne({ id, isActive: true } as Record<string, any>);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Show response
    response.status = 'VISIBLE';
    await response.save();

    res.json({
      message: 'Response shown successfully',
      data: response,
    });
  } catch (error) {
    console.error('Error showing response:', error);
    res.status(500).json({ error: 'Failed to show response' });
  }
};

// Get all responses by user
export const getResponsesByUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const responses = await ResponseModel.find({ userId, isActive: true } as Record<string, any>).sort({ createdAt: -1 });

    res.json({
      message: 'User responses retrieved successfully',
      data: responses,
    });
  } catch (error) {
    console.error('Error fetching user responses:', error);
    res.status(500).json({ error: 'Failed to fetch user responses' });
  }
};
