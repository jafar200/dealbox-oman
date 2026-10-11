import multer from 'multer';
import fs from 'node:fs';
import { isCloudinaryEnabled, uploadBufferToCloudinary } from '../config/cloudinary.js';

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
 * - عند تفعيل Cloudinary → تخزين مؤقت في الذاكرة ثم رفع خارجي دائم.
 * - بدونه → تخزين على القرص المحلي (وضع التطوير).
 */
export const createImageUploader = ({ diskDir, filenameFn }) => {
  const storage = isCloudinaryEnabled()
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
 * تحويل الملف المرفوع إلى رابط عام:
 * - ملف من الذاكرة → يُرفع إلى Cloudinary ويُعاد رابط CDN الدائم.
 * - ملف من القرص → يُعاد المسار المحلي `/uploads/...`.
 */
export const resolveUploadedUrl = async (file, { cloudFolder, localPrefix }) => {
  if (!file) throw new Error('لم يتم اختيار صورة');
  if (file.buffer) {
    return uploadBufferToCloudinary(file.buffer, { folder: cloudFolder });
  }
  return `${localPrefix}/${file.filename}`;
};
