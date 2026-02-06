import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IResponse extends Document {
  id: string;
  requestId: string;     // Reference to Request
  userId: string;        // Reference to User who responded
  content: string;       // Response message
  status: 'VISIBLE' | 'HIDDEN';  // Visibility status
  views: number;         // Number of views
  likes: number;         // Number of likes
  likedBy: string[];     // Array of user IDs who liked this response
  isActive: boolean;     // Soft delete flag
  createdAt: Date;
  updatedAt: Date;
}

const responseSchema = new Schema<IResponse>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    requestId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['VISIBLE', 'HIDDEN'], default: 'VISIBLE', index: true },
    views: { type: Number, default: 0, index: true },
    likes: { type: Number, default: 0, index: true },
    likedBy: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'responses' }
);

// Index for searching responses by request and user
responseSchema.index({ requestId: 1, createdAt: -1 });
responseSchema.index({ userId: 1, createdAt: -1 });
responseSchema.index({ requestId: 1, status: 1 });

export default mongoose.model<IResponse>('Response', responseSchema);
