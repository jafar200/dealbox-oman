import mongoose from 'mongoose';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENV } from './env.js';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const developmentMongoDataPath = path.resolve(configDirectory, '../../data/mongodb');
let developmentMongoServer;

const isLocalMongoUri = (uri) => /^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/)/i.test(uri);

const getDatabaseName = (uri) => {
  try {
    return new URL(uri).pathname.replace(/^\//, '').split('/')[0] || 'dealbox_oman';
  } catch {
    return 'dealbox_oman';
  }
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DealBox DB] MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (ENV.NODE_ENV !== 'production' && isLocalMongoUri(ENV.MONGO_URI)) {
      console.warn(`[DealBox DB] Local MongoDB unavailable: ${error.message}`);
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        await mkdir(developmentMongoDataPath, { recursive: true });
        developmentMongoServer = await MongoMemoryServer.create({
          instance: {
            dbPath: developmentMongoDataPath,
            ip: '127.0.0.1',
            port: 27017,
            storageEngine: 'wiredTiger',
          },
        });
        const databaseName = getDatabaseName(ENV.MONGO_URI);
        const conn = await mongoose.connect(developmentMongoServer.getUri(databaseName), {
          serverSelectionTimeoutMS: 10000,
        });
        console.log(`[DealBox DB] Persistent local development database ready: ${developmentMongoDataPath}`);
        return conn;
      } catch (fallbackError) {
        await developmentMongoServer?.stop().catch(() => {});
        developmentMongoServer = undefined;
        console.error('[DealBox DB] Could not start the local development database:', fallbackError.message);
      }
      return null;
    }

    console.warn(`[DealBox DB] MongoDB Connection Warning: ${error.message}`);
    console.warn('[DealBox DB] Database-backed operations are unavailable until MongoDB reconnects.');
    return null;
  }
};
