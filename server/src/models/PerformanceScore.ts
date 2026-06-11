import { Schema, model, Types } from 'mongoose';

export interface IPerformanceScore {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  score: number; // 0-100
  breakdown: {
    taskCompletion: number; // %
    onTimeDelivery: number; // %
    followupClosure: number; // %
    consistency: number; // 0-100 (days logged / working days)
    efficiency: number; // % (estimated / actual)
    bonus: number; // points added
  };
  summary: string; // AI-generated summary
  metrics: {
    tasksCompleted: number;
    tasksOnTime: number;
    hoursLogged: number;
    followupsClosed: number;
    followupsOverdue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const performanceScoreSchema = new Schema<IPerformanceScore>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    score: { type: Number, required: true, min: 0, max: 100 },
    breakdown: {
      taskCompletion: { type: Number, default: 0 },
      onTimeDelivery: { type: Number, default: 0 },
      followupClosure: { type: Number, default: 0 },
      consistency: { type: Number, default: 0 },
      efficiency: { type: Number, default: 100 },
      bonus: { type: Number, default: 0 },
    },
    summary: { type: String, default: '' },
    metrics: {
      tasksCompleted: { type: Number, default: 0 },
      tasksOnTime: { type: Number, default: 0 },
      hoursLogged: { type: Number, default: 0 },
      followupsClosed: { type: Number, default: 0 },
      followupsOverdue: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

performanceScoreSchema.index({ businessId: 1, userId: 1, date: 1 }, { unique: true });
performanceScoreSchema.index({ businessId: 1, date: -1 });

export const PerformanceScore = model<IPerformanceScore>('PerformanceScore', performanceScoreSchema);
