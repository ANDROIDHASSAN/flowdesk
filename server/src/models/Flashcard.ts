import { Schema, model, Document, Types } from 'mongoose';

export interface IFlashcard extends Document {
  businessId: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isPublic: boolean;
  tags: string[];
  reviewCount: number;
  correctCount: number;
  nextReviewDate?: string;
  lastReviewedAt?: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'General' },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
    isPublic: { type: Boolean, default: true },
    tags: [{ type: String }],
    reviewCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    nextReviewDate: { type: String },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true }
);

FlashcardSchema.index({ businessId: 1, category: 1 });
FlashcardSchema.index({ businessId: 1, createdBy: 1 });

export const Flashcard = model<IFlashcard>('Flashcard', FlashcardSchema);
