import mongoose from 'mongoose';
import { env } from './env';

let _usingMemory = false;
export const isUsingMemoryDB = () => _usingMemory;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return;
  mongoose.set('strictQuery', true);

  // In development, try Atlas first (short timeout), fall back to in-memory
  if (process.env.NODE_ENV !== 'production') {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('[db] connected to MongoDB Atlas');
      return;
    } catch {
      console.warn('[db] Atlas unreachable — starting local in-memory MongoDB');
      console.warn('[db] Fix: whitelist your IP at cloud.mongodb.com → Security → Network Access');
    }

    // Fall back to in-memory MongoDB with generous timeout for first-time binary setup
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mem = await MongoMemoryServer.create({
      instance: { startupTimeout: 120_000 } as any, // v11 types omit startupTimeout but it still works
    });
    _usingMemory = true;

    // Clean up when the process exits so the next start doesn't hit a port conflict
    process.on('exit', () => { mem.stop().catch(() => {}); });
    process.on('SIGINT', () => { mem.stop().catch(() => {}); process.exit(0); });
    process.on('SIGTERM', () => { mem.stop().catch(() => {}); process.exit(0); });

    await mongoose.connect(mem.getUri());
    console.log('[db] connected to in-memory MongoDB');
    return;
  }

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });
  console.log('[db] connected to MongoDB');
}
