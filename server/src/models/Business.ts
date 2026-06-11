import { Schema, model, Types } from 'mongoose';

export interface IBusiness {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const Business = model<IBusiness>('Business', businessSchema);
