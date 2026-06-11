import { Schema, model, Types } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatHistory {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  messages: IChatMessage[];
  lastUpdated: Date;
  createdAt: Date;
}

const chatHistorySchema = new Schema<IChatHistory>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatHistorySchema.index({ businessId: 1, userId: 1 });

export const ChatHistory = model<IChatHistory>('ChatHistory', chatHistorySchema);
