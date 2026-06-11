import type { IncomingMessage, ServerResponse } from 'http';
import mongoose from 'mongoose';
import { connectDB } from '../server/src/config/db';
import app from '../server/src/app';

let isConnected = false;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    await connectDB();
    isConnected = true;
  }
  return app(req as any, res as any);
}
