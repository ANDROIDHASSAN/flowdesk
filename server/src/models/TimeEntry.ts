import { Schema, model, Types } from 'mongoose';

export type TimeSource = 'MANUAL' | 'TIMER';

export interface ITimeEntry {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  taskId?: Types.ObjectId;
  /** IST calendar day as YYYY-MM-DD — timezone-proof for an India-based team */
  date: string;
  minutes: number;
  note?: string;
  source: TimeSource;
  createdAt: Date;
  updatedAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    minutes: { type: Number, required: true, min: 1, max: 1440 },
    note: { type: String, trim: true },
    source: { type: String, enum: ['MANUAL', 'TIMER'], default: 'MANUAL' },
  },
  { timestamps: true }
);

timeEntrySchema.index({ businessId: 1, userId: 1, date: 1 });
timeEntrySchema.index({ date: 1 });

export const TimeEntry = model<ITimeEntry>('TimeEntry', timeEntrySchema);
