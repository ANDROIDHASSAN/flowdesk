import { Schema, model, Types } from 'mongoose';

export interface IDailyLog {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  /** IST calendar day as YYYY-MM-DD */
  date: string;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const dailyLogSchema = new Schema<IDailyLog>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    summary: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

dailyLogSchema.index({ businessId: 1, userId: 1, date: 1 }, { unique: true });
dailyLogSchema.index({ date: 1 });

export const DailyLog = model<IDailyLog>('DailyLog', dailyLogSchema);
