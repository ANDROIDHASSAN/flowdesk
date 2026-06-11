import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return; // reuse existing connection in serverless
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });
  console.log('[db] connected to MongoDB');
}
