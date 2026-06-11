import { Schema, model, Types } from 'mongoose';

export interface IInvite {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  email: string;
  displayName?: string;
  token: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    displayName: { type: String, trim: true },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

inviteSchema.index({ businessId: 1, email: 1 });

export const Invite = model<IInvite>('Invite', inviteSchema);
