import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ICategory extends Document {
  id: string;
  name: string;
  description?: string | undefined;
  isActive: boolean;
  createdBy: string; 
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    name: { type: String, required: true, unique: true, index: true },
    description: String,
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true }, // store admin user ID
  },
  { timestamps: true, collection: 'categories' }
);

// Index for searching active categories
categorySchema.index({ name: 'text', description: 'text', isActive: 1 });

export default mongoose.model<ICategory>('Category', categorySchema);
