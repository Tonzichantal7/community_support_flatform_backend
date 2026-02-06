import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IRequest extends Document {
  id: string;
  userId: string;        // reference to User
  categoryId: string;    // reference to Category
  title: string;
  description: string;
  type: "REQUEST" | "OFFER";
  location: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminApproved: boolean;  // Admin approval status for requests before user can offer service
  canOfferService: boolean; // Whether user can offer service on this request (only if approved)
  approvedBy?: string;     // Admin ID who approved the request
  approvedAt?: Date;       // Timestamp when request was approved
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<IRequest>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    userId: { type: String, required: true, index: true },
    categoryId: { type: String, required: true, index: true },
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['REQUEST', 'OFFER'], required: true, index: true },
    location: { type: String, required: true, index: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
    adminApproved: { type: Boolean, default: false, index: true },
    canOfferService: { type: Boolean, default: false, index: true },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'requests' }
);

// Index for searching requests
requestSchema.index({ title: 'text', description: 'text', location: 'text' });
requestSchema.index({ userId: 1, createdAt: -1 });
requestSchema.index({ categoryId: 1, status: 1 });

export default mongoose.model<IRequest>('Request', requestSchema);
