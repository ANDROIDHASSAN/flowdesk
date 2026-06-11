import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  period: string; // YYYY-MM
  baseSalary: number;
  bonusAmount: number;
  deductionAmount: number;
  totalAmount: number;
  currency: string;
  actualHoursWorked: number;
  tasksCompleted: number;
  performanceScore: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID';
  paidAt?: Date;
  approvedBy?: Types.ObjectId;
  notes?: string;
  paymentMethod?: string;
  transactionId?: string;
}

const PaymentSchema = new Schema<IPayment>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    period: { type: String, required: true }, // YYYY-MM
    baseSalary: { type: Number, default: 0 },
    bonusAmount: { type: Number, default: 0 },
    deductionAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    actualHoursWorked: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },
    status: { type: String, enum: ['DRAFT', 'PENDING', 'APPROVED', 'PAID'], default: 'DRAFT' },
    paidAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    paymentMethod: { type: String },
    transactionId: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ businessId: 1, userId: 1, period: 1 }, { unique: true });
PaymentSchema.index({ businessId: 1, period: 1 });
PaymentSchema.index({ businessId: 1, status: 1 });

export const Payment = model<IPayment>('Payment', PaymentSchema);
