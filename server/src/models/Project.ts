import { Schema, model, Types } from 'mongoose';

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold';

export interface IProject {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  description?: string;
  status: ProjectStatus;
  estimatedHours: number;
  actualHours?: number;
  hourlyRate: number; // cost to client per hour
  costRate?: number; // actual cost per hour (internal)
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['planning', 'active', 'completed', 'on-hold'], default: 'planning' },
    estimatedHours: { type: Number, required: true, min: 1 },
    actualHours: { type: Number, default: 0 },
    hourlyRate: { type: Number, required: true, min: 0 }, // billable rate
    costRate: { type: Number, default: 0 }, // internal cost per hour
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

projectSchema.index({ businessId: 1, status: 1 });

export const Project = model<IProject>('Project', projectSchema);
