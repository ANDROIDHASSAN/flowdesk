import { Schema, model, Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
