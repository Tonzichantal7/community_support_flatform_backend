import { Request } from 'express';
import multer from 'multer';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  file?: Express.Multer.File;
}