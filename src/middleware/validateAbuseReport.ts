import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export function validateAbuseReportSubmission(req: AuthRequest, res: Response, next: NextFunction): void {
  const { requestId, responseId, reason, description } = req.body;
  
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ message: 'Reason is required and must be a non-empty string' });
    return;
  }
  
  if (reason.trim().length < 5) {
    res.status(400).json({ message: 'Reason must be at least 5 characters long' });
    return;
  }
  
  if (reason.length > 500) {
    res.status(400).json({ message: 'Reason must not exceed 500 characters' });
    return;
  }
  
  if (!requestId && !responseId) {
    res.status(400).json({ 
      message: 'Either requestId or responseId must be provided to report abuse' 
    });
    return;
  }
  
  if (description && description.length > 2000) {
    res.status(400).json({ message: 'Description must not exceed 2000 characters' });
    return;
  }
  
  next();
}
