import dotenv from 'dotenv';

dotenv.config();

const {
  B2_KEY_ID,
  B2_APPLICATION_KEY,
  B2_BUCKET_NAME,
  B2_ENDPOINT,
  B2_PUBLIC_URL,
} = process.env;

export const isB2Enabled = () =>
  Boolean(B2_KEY_ID && B2_APPLICATION_KEY && B2_BUCKET_NAME && B2_ENDPOINT);

if (isB2Enabled()) {
  console.log('[DealBox Uploads] التخزين الخارجي مفعّل (Backblaze B2)');
} else {
  console.log('[DealBox Uploads] التخزين الخارجي غير مضبوط (Backblaze B2) — الرفع على القرص المحلي');
}

export const b2Config = {
  keyId: B2_KEY_ID,
  applicationKey: B2_APPLICATION_KEY,
  bucketName: B2_BUCKET_NAME,
  endpoint: B2_ENDPOINT,
  publicUrl: B2_PUBLIC_URL,
};
