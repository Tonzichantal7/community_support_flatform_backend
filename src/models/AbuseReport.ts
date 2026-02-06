import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TargetType = 'REQUEST' | 'RESPONSE' | 'USER' | 'OTHER';

export type ModerationActionType = 'REMOVE' | 'RESTORE' | 'DISMISS' | 'WARN' | 'NO_ACTION';

export interface IModerationAction {
  adminId: string;
  action: ModerationActionType;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IAbuseReport extends Document {
  id: string;
  reporterId: string; // user who reported
  targetType: TargetType;
  targetId: string; // id of request/response/user
  reason: string; // chosen reason
  details?: string; // optional reporter details
  status: 'OPEN' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED';
  isActive: boolean; // soft-delete for report
  actions: IModerationAction[]; // moderation history
  createdAt: Date;
  updatedAt: Date;
}

const moderationActionSchema = new Schema<IModerationAction>(
  {
    adminId: { type: String, required: true },
    action: { type: String, required: true },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const abuseReportSchema = new Schema<IAbuseReport>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    reporterId: { type: String, required: true, index: true },
    targetType: { type: String, enum: ['REQUEST', 'RESPONSE', 'USER', 'OTHER'], required: true, index: true },
    targetId: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    details: { type: String },
    status: { type: String, enum: ['OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED'], default: 'OPEN', index: true },
    isActive: { type: Boolean, default: true, index: true },
    actions: { type: [moderationActionSchema], default: [] },
  },
  { timestamps: true, collection: 'abuse_reports' }
);

abuseReportSchema.index({ reporterId: 1, targetId: 1, status: 1 });

export default mongoose.model<IAbuseReport>('AbuseReport', abuseReportSchema);
