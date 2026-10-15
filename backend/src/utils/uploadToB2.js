import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { b2Config } from '../config/b2.js';

const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/** استخراج منطقة B2 من نقطة النهاية، مثل: https://s3.us-west-002.backblazeb2.com → us-west-002 */
const regionFromEndpoint = (endpoint = '') => {
  const match = String(endpoint).match(/s3[.-]([a-z0-9-]+)\.backblazeb2\.com/i);
  return match ? match[1] : 'us-west-002';
};

let s3;

function getClient() {
  if (!s3) {
    s3 = new S3Client({
      endpoint: b2Config.endpoint,
      region: regionFromEndpoint(b2Config.endpoint),
      credentials: {
        accessKeyId: b2Config.keyId,
        secretAccessKey: b2Config.applicationKey,
      },
      forcePathStyle: true,
    });
  }
  return s3;
}

/**
 * رفع صورة (Buffer) إلى Backblaze B2 وإرجاع الرابط العام الدائم.
 * ملاحظة: لا نرسل ACL لأن B2 لا يدعم ACL على مستوى الكائن —
 * الملف يرث صلاحية الحاوية، لذلك يجب أن تكون الحاوية Public.
 */
export async function uploadBufferToB2(buffer, { folder = 'dealbox', key, mimetype } = {}) {
  const client = getClient();
  const ext = EXT_BY_MIME[mimetype] || 'png';

  let fullKey = key;
  if (!fullKey) {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    fullKey = `${folder}/${ts}-${rand}.${ext}`;
  }

  await client.send(new PutObjectCommand({
    Bucket: b2Config.bucketName,
    Key: fullKey,
    Body: buffer,
    ContentType: mimetype || 'image/png',
  }));

  const base = (b2Config.publicUrl || `https://f005.backblazeb2.com/file/${b2Config.bucketName}`)
    .replace(/\/$/, '');
  return `${base}/${fullKey}`;
}
