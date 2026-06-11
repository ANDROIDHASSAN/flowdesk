import { Schema, model, Types } from 'mongoose';

export type Role = 'OWNER' | 'MEMBER';

export interface IMembership {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  role: Role;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['OWNER', 'MEMBER'], required: true },
    displayName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

membershipSchema.index({ businessId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ userId: 1, role: 1 });

export const Membership = model<IMembership>('Membership', membershipSchema);
