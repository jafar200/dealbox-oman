import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const usesGeneratedSecret = !process.env.JWT_SECRET && !isProduction;
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : randomBytes(32).toString('hex'));

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production');
}

if (usesGeneratedSecret) {
  console.warn('[DealBox ENV] JWT_SECRET is missing, so a random one was generated for this process only. '
    + 'Every server restart will invalidate all issued tokens. Set JWT_SECRET in backend/.env.');
}

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/dealbox_oman',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  ADMIN_REGISTRATION_CODE: process.env.ADMIN_REGISTRATION_CODE,
  COMMISSION_RATE: parseFloat(process.env.COMMISSION_RATE || '0.15'), // 15% platform commission
  DEFAULT_CURRENCY: 'ر.ع', // Omani Rial
  DEFAULT_WILAYAH: 'السيب (الخوض)',
  // البريد الإلكتروني لاستعادة كلمة المرور — يُفعّل SMTP عند شراء الدومين وإعداد المرسل.
  // قبلها يعمل النظام في «وضع التطوير» ويعرض رابط إعادة التعيين مباشرة في الواجهة.
  MAIL_ENABLED: process.env.MAIL_ENABLED === 'true',
  MAIL_HOST: process.env.MAIL_HOST || '',
  MAIL_PORT: parseInt(process.env.MAIL_PORT || '587', 10),
  MAIL_USER: process.env.MAIL_USER || '',
  MAIL_PASS: process.env.MAIL_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'DealBox عُمان <no-reply@dealbox.om>',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  // Web Push (VAPID) — إشعارات المتصفح/الهاتف عبر Service Worker
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:no-reply@dealbox.om',
};
