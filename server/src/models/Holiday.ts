import { Schema, model, Document, Types } from 'mongoose';

export interface IHoliday extends Document {
  businessId: Types.ObjectId;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'PUBLIC' | 'COMPANY' | 'OPTIONAL' | 'BIRTHDAY' | 'ANNIVERSARY';
  isRecurring: boolean;
  description?: string;
  color?: string;
  employeeId?: Types.ObjectId; // for birthday/anniversary
}

const HolidaySchema = new Schema<IHoliday>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, enum: ['PUBLIC', 'COMPANY', 'OPTIONAL', 'BIRTHDAY', 'ANNIVERSARY'], default: 'COMPANY' },
    isRecurring: { type: Boolean, default: true },
    description: { type: String },
    color: { type: String, default: '#6366F1' },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

HolidaySchema.index({ businessId: 1, date: 1 });

export const Holiday = model<IHoliday>('Holiday', HolidaySchema);
