import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  profilePicture?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}

const userSchema = new Schema({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true, index: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER, index: true },
  profilePicture: String,
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: { type: Date, default: Date.now, index: true }
});

userSchema.index({ name: 'text', email: 'text' });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model<IUser>('User', userSchema);