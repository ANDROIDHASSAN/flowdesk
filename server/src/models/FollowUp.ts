import { Schema, model, Types } from 'mongoose';

export type FollowUpStatus = 'PENDING' | 'DONE' | 'OVERDUE';

export interface IFollowUp {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  clientName: string;
  contact?: string;
  note?: string;
  dueAt: Date;
  status: FollowUpStatus;
  outcome?: string;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUp>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientName: { type: String, required: true, trim: true },
    contact: { type: String, trim: true },
    note: { type: String, trim: true },
    dueAt: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'DONE', 'OVERDUE'], default: 'PENDING' },
    outcome: { type: String, trim: true },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

followUpSchema.index({ businessId: 1, userId: 1 });
followUpSchema.index({ businessId: 1, status: 1 });
followUpSchema.index({ dueAt: 1 });

export const FollowUp = model<IFollowUp>('FollowUp', followUpSchema);
