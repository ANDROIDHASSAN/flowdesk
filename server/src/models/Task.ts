import { Schema, model, Types } from 'mongoose';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MED' | 'HIGH';

export interface ITask {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  assigneeId: Types.ObjectId;
  projectId?: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: Date;
  completedAt?: Date;
  confirmedByOwner: boolean;
  estimatedHours?: number;
  actualHours?: number;
  hourlyRate?: number;
  isBillable?: boolean;
  overdueNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
    priority: { type: String, enum: ['LOW', 'MED', 'HIGH'], default: 'MED' },
    dueAt: { type: Date },
    completedAt: { type: Date },
    confirmedByOwner: { type: Boolean, default: false },
    estimatedHours: { type: Number, min: 0.5 },
    actualHours: { type: Number, default: 0, min: 0 },
    hourlyRate: { type: Number, min: 0 },
    isBillable: { type: Boolean, default: true },
    overdueNotifiedAt: { type: Date },
  },
  { timestamps: true }
);

taskSchema.index({ businessId: 1, assigneeId: 1 });
taskSchema.index({ businessId: 1, status: 1 });
taskSchema.index({ dueAt: 1 });

export const Task = model<ITask>('Task', taskSchema);
