import express from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();

/* ملفات الموقع التسويقي المرفوعة (شعار/هيدر/تحميل) */
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Body Parser
app.use(express.json({ limit: '8mb' }));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'DealBox Sultanate of Oman API',
    wilayah: 'السيب (الخوض)',
    currency: 'ر.ع (OMR)',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', marketingRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = ENV.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[DealBox] Backend Server running on port ${PORT} in ${ENV.NODE_ENV} mode`);
    });
  };
  startServer().catch((error) => {
    console.error('[DealBox] Backend startup failed:', error.message);
    process.exitCode = 1;
  });
}

export default app;
