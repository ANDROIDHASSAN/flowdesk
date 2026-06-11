import { Schema, model, Types } from 'mongoose';

export type NotificationType =
  | 'FOLLOWUP_DUE'
  | 'FOLLOWUP_OVERDUE'
  | 'FOLLOWUP_ESCALATION'
  | 'TASK_OVERDUE'
  | 'TASK_ASSIGNED'
  | 'DAILY_NUDGE'
  | 'GENERAL';

export interface INotification {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
