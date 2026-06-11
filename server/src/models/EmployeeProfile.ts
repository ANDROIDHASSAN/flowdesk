import { Schema, model, Document, Types } from 'mongoose';

export interface IEmployeeProfile extends Document {
  userId: Types.ObjectId;
  businessId: Types.ObjectId;
  birthday?: string; // YYYY-MM-DD
  joiningDate?: string;
  phone?: string;
  department?: string;
  designation?: string;
  skills: string[];
  salary?: number;
  salaryType: 'MONTHLY' | 'HOURLY' | 'PROJECT';
  currency: string;
  vacationDays: number;
  vacationUsed: number;
  emergencyContact?: string;
  bio?: string;
  avatar?: string;
  isOnVacation: boolean;
  vacationStart?: string;
  vacationEnd?: string;
}

const EmployeeProfileSchema = new Schema<IEmployeeProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    birthday: { type: String },
    joiningDate: { type: String },
    phone: { type: String },
    department: { type: String },
    designation: { type: String },
    skills: [{ type: String }],
    salary: { type: Number },
    salaryType: { type: String, enum: ['MONTHLY', 'HOURLY', 'PROJECT'], default: 'MONTHLY' },
    currency: { type: String, default: 'INR' },
    vacationDays: { type: Number, default: 24 },
    vacationUsed: { type: Number, default: 0 },
    emergencyContact: { type: String },
    bio: { type: String },
    avatar: { type: String },
    isOnVacation: { type: Boolean, default: false },
    vacationStart: { type: String },
    vacationEnd: { type: String },
  },
  { timestamps: true }
);

EmployeeProfileSchema.index({ businessId: 1, userId: 1 }, { unique: true });

export const EmployeeProfile = model<IEmployeeProfile>('EmployeeProfile', EmployeeProfileSchema);
