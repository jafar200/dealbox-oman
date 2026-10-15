/**
 * شعار المنظومة (Project Logo) — يُحفظ على الخادم ليظهر على كل الأجهزة.
 *
 * سابقاً كان الشعار يُحفظ في متصفح الأدمن فقط (IndexedDB)، فلم يكن يظهر
 * على الهواتف أو أي جهاز آخر. الآن يُرفع إلى الخادم ويُجلب من مسار عام.
 *
 * ملاحظة: مسارات نسبية — تُوجَّه تلقائياً للخادم عبر window.fetch في main.tsx.
 */

/** يجلب شعار المنظومة من الخادم. يُرجع '' إذا لم يُضبط شعار بعد. */
export const fetchProjectBranding = async (): Promise<string> => {
  try {
    const response = await fetch('/api/v1/client/branding');
    const result = await response.json();
    if (result?.success && typeof result.logoUrl === 'string') {
      return result.logoUrl;
    }
  } catch {
    /* الخادم غير متاح — نستخدم الشعار المحفوظ محلياً كاحتياطي */
  }
  return '';
};

/** يحوّل data URL إلى Blob لإرساله كملف إلى الخادم. */
const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, payload] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/png';
  const isBase64 = header.includes(';base64');
  if (!isBase64) {
    return new Blob([decodeURIComponent(payload)], { type: mime });
  }
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

const extensionForMime = (mime: string): string => {
  if (mime.includes('svg')) return 'svg';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'png';
};

/** أقصى بُعد للشعار قبل الرفع — يقلّل الحجم خصوصاً عند التخزين داخل قاعدة البيانات. */
const MAX_LOGO_DIMENSION = 256;

/** يصغّر صورة (data URL) إلى أقصى بُعد `MAX_LOGO_DIMENSION` مع الحفاظ على الشفافية. */
const downscaleDataUrl = (dataUrl: string): Promise<string> =>
  new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(dataUrl);
      return;
    }
    const image = new Image();
    image.onload = () => {
      const largest = Math.max(image.width, image.height);
      if (!largest || largest <= MAX_LOGO_DIMENSION) {
        resolve(dataUrl);
        return;
      }
      const scale = MAX_LOGO_DIMENSION / largest;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });

/** توكن الأدمن/المستخدم — يُخزَّن بنفس مفتاح جلسة الواجهة. */
const readAuthToken = (): string | null =>
  (typeof localStorage !== 'undefined' ? localStorage.getItem('dealbox_auth_token_v1') : null);

/**
 * يرفع شعار المنظومة إلى الخادم ويُرجع رابطه الدائم.
 * @param image data URL (نتيجة اختيار ملف في لوحة الأدمن).
 * @returns الرابط على الخادم، أو null عند الفشل.
 */
export const uploadProjectBranding = async (image: string): Promise<string | null> => {
  const resized = await downscaleDataUrl(image);
  const blob = dataUrlToBlob(resized);
  const form = new FormData();
  form.append('image', blob, `dealbox-logo.${extensionForMime(blob.type)}`);

  const token = readAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch('/api/v1/admin/branding/logo', {
    method: 'POST',
    headers,
    body: form,
  });
  const result = await response.json().catch(() => null);
  if (response.ok && result?.success && result.logoUrl) {
    return result.logoUrl as string;
  }
  throw new Error(result?.message || 'تعذر رفع شعار المنظومة');
};

/** يحذف شعار المنظومة من الخادم (استعادة الافتراضي). */
export const deleteProjectBranding = async (): Promise<void> => {
  const token = readAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  await fetch('/api/v1/admin/branding/logo', { method: 'DELETE', headers });
};
