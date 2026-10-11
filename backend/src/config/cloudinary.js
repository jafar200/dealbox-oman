import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

/**
 * التخزين الخارجي الدائم للصور (Cloudinary — خطة مجانية).
 * يُفعّل تلقائياً عند ضبط المتغيرات الثلاثة، وإلا يبقى الرفع على القرص المحلي (للتطوير).
 */
export const isCloudinaryEnabled = () =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

if (isCloudinaryEnabled()) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[DealBox Uploads] التخزين الخارجي مفعّل (Cloudinary)');
} else {
  console.log('[DealBox Uploads] التخزين الخارجي غير مضبوط — الرفع على القرص المحلي');
}

/** رفع محتوى صورة (Buffer) إلى Cloudinary وإرجاع الرابط الدائم عبر CDN. */
export const uploadBufferToCloudinary = (buffer, { folder = 'dealbox' } = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
