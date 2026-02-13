import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IModerationHistory extends Document {
  id: string;
  action: 'ban_user' | 'unban_user' | 'delete_post' | 'delete_response' | 'approve_post' | 'reject_post' | 'resolve_report' | 'dismiss_report';
  targetType: 'user' | 'request' | 'response' | 'report';
  targetId: string;
  moderatorId: string;
  reason?: string;
  details?: any;
  createdAt: Date;
}

const moderationHistorySchema = new Schema({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  action: { 
    type: String, 
    required: true,
    enum: ['ban_user', 'unban_user', 'delete_post', 'delete_response', 'approve_post', 'reject_post', 'resolve_report', 'dismiss_report'],
    index: true
  },
  targetType: { 
    type: String, 
    required: true,
    enum: ['user', 'request', 'response', 'report']
  },
  targetId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true, ref: 'User', index: true },
  reason: String,
  details: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true }
});

moderationHistorySchema.index({ moderatorId: 1, createdAt: -1 });
moderationHistorySchema.index({ targetId: 1, createdAt: -1 });

export default mongoose.model<IModerationHistory>('ModerationHistory', moderationHistorySchema);
