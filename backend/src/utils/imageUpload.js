import multer from 'multer';
import fs from 'node:fs';
import { isB2Enabled } from '../config/b2.js';
import { uploadBufferToB2 } from './uploadToB2.js';

export const ALLOWED_IMAGE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 ميغابايت
export const IMAGE_MIME_ERROR = 'نوع الصورة غير مدعوم — استخدم PNG أو JPG أو GIF أو WebP أو SVG';

const imageFileFilter = (_req, file, cb) => {
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    cb(new Error(IMAGE_MIME_ERROR));
    return;
  }
  cb(null, true);
};

/**
 * وسيط رفع موحّد:
 * - عند تفعيل Backblaze B2 → تخزين مؤقت في الذاكرة ثم رفع دائم إلى B2.
 * - بدونه → تخزين على القرص المحلي (وضع التطوير فقط؛ قرص Render مؤقت).
 */
export const createImageUploader = ({ diskDir, filenameFn }) => {
  const storage = isB2Enabled()
    ? multer.memoryStorage()
    : multer.diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(diskDir, { recursive: true });
        cb(null, diskDir);
      },
      filename: (req, file, cb) => filenameFn(req, file, cb),
    });

  return multer({
    storage,
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    fileFilter: imageFileFilter,
  });
};

/**
 * تحويل الملف المرفوع إلى رابط دائم (B2) أو رابط محلي (تطوير).
 */
export const resolveUploadedUrl = async (file, { cloudFolder, localPrefix, key }) => {
  if (!file) throw new Error('لم يتم اختيار صورة');
  if (file.buffer) {
    if (isB2Enabled()) {
      return uploadBufferToB2(file.buffer, {
        folder: cloudFolder || 'dealbox',
        key,
        mimetype: file.mimetype,
      });
    }
    throw new Error('لا يوجد تخزين خارجي مُفعّل (Backblaze B2)');
  }
  return `${localPrefix}/${file.filename}`;
};
