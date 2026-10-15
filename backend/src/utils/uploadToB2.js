import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  B2_KEY_ID,
  B2_APPLICATION_KEY,
  B2_BUCKET_NAME,
  B2_ENDPOINT,
  B2_PUBLIC_URL,
} = process.env;

let s3;

function getClient() {
  if (!s3) {
    s3 = new S3Client({
      endpoint: B2_ENDPOINT,
      region: 'us-west-002',
      credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APPLICATION_KEY,
      },
      forcePathStyle: true,
    });
  }
  return s3;
}

export async function uploadBufferToB2(buffer, { folder = 'dealbox', key }) {
  const client = getClient();
  let fullKey = key;
  if (!fullKey) {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    fullKey = `${folder}/${ts}-${rand}.png`;
  }
  const command = new PutObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: fullKey,
    Body: buffer,
    ACL: 'public-read',
    ContentType: 'image/png',
  });
  await client.send(command);
  if (B2_PUBLIC_URL) {
    const base = B2_PUBLIC_URL.replace(/\/$/, '');
    return `${base}/${fullKey}`;
  }
  return `https://f005.backblazeb2.com/file/${B2_BUCKET_NAME}/${fullKey}`;
}
