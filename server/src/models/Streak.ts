import { Schema, model, Document, Types } from 'mongoose';

export interface IStreak extends Document {
  userId: Types.ObjectId;
  businessId: Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD
  totalActiveDays: number;
  xpPoints: number;
  level: number;
  badges: string[];
  weeklyActivity: { date: string; score: number }[];
}

const StreakSchema = new Schema<IStreak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: String, default: '' },
    totalActiveDays: { type: Number, default: 0 },
    xpPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }],
    weeklyActivity: [
      {
        date: { type: String },
        score: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

StreakSchema.index({ businessId: 1, userId: 1 }, { unique: true });

export const Streak = model<IStreak>('Streak', StreakSchema);
