import { GoogleAuth } from 'google-auth-library';
import { ENV } from '../config/env.js';
import DeviceToken from '../models/DeviceToken.js';

/**
 * Firebase Cloud Messaging (FCM) — إشعارات تطبيق الجوال (أندرويد/iOS).
 *
 * تُرسل عبر FCM HTTP v1 باستخدام حساب خدمة (Service Account) من Firebase،
 * مع إعادة استخدام google-auth-library المثبّتة أصلاً (بدون تبعيات جديدة ثقيلة).
 *
 * عند غياب مفاتيح Firebase تعمل بقية الميزات بشكل عادي وتُتخطّى الإشعارات بهدوء.
 */

const isConfigured = Boolean(
  ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY,
);

if (!isConfigured) {
  console.warn('[DealBox FCM] Firebase service account keys missing — in-app (Android/iOS) '
    + 'push notifications are disabled. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
}

let authClientPromise = null;

const getAccessToken = async () => {
  if (!isConfigured) return null;
  if (!authClientPromise) {
    const auth = new GoogleAuth({
      credentials: {
        client_email: ENV.FIREBASE_CLIENT_EMAIL,
        private_key: ENV.FIREBASE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    authClientPromise = auth.getClient();
  }
  const client = await authClientPromise;
  const accessToken = await client.getAccessToken();
  return accessToken?.token || null;
};

export const isFcmConfigured = () => isConfigured;

/** حفظ/تحديث توكن جهاز (نفس التوكن لا يتكرر). */
export const saveDeviceToken = async ({ token, platform, userAgent }) => {
  await DeviceToken.updateOne(
    { token },
    {
      $set: {
        token,
        platform: platform || 'android',
        userAgent: userAgent || '',
        lastSeenAt: new Date(),
      },
    },
    { upsert: true },
  );
};

/** إزالة توكن جهاز (عند تسجيل الخروج أو إلغاء التثبيت). */
export const removeDeviceToken = async (token) => {
  if (!token) return;
  await DeviceToken.deleteOne({ token });
};

const sendToToken = (accessToken, deviceToken, { title, body, url }) => {
  const endpoint = `https://fcm.googleapis.com/v1/projects/${ENV.FIREBASE_PROJECT_ID}/messages:send`;
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification: { title: title || 'DealBox عُمان', body: body || '' },
        data: { url: url || '/?portal=client' },
        android: {
          priority: 'high',
          notification: { channel_id: 'dealbox_announcements', sound: 'default' },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      },
    }),
  });
};

/**
 * إرسال التنبيه العام لكل أجهزة التطبيق المسجّلة.
 * التوكنات غير الصالحة (UNREGISTERED/404) تُحذف تلقائياً.
 * لا ترمي استثناءً — الفشل لا يجب أن يعطّل نشر التنبيه.
 */
export const sendAnnouncementFcm = async ({ title, body, url }) => {
  if (!isConfigured) return { sent: 0, removed: 0, skipped: true };

  const devices = await DeviceToken.find().lean();
  if (!devices.length) return { sent: 0, removed: 0, skipped: false };

  const accessToken = await getAccessToken();
  if (!accessToken) return { sent: 0, removed: 0, skipped: true };

  let sent = 0;
  let removed = 0;
  const staleTokens = [];

  await Promise.all(devices.map(async (device) => {
    try {
      const response = await sendToToken(accessToken, device.token, { title, body, url });
      if (response.ok) {
        sent += 1;
        return;
      }
      let errorBody = '';
      try { errorBody = await response.text(); } catch { /* تجاهل */ }
      if (response.status === 404 || /UNREGISTERED/.test(errorBody)) {
        staleTokens.push(device.token);
        removed += 1;
      } else {
        console.warn('[DealBox FCM] send failed:', response.status, errorBody.slice(0, 200));
      }
    } catch (error) {
      console.warn('[DealBox FCM] send error:', error?.message || error);
    }
  }));

  if (staleTokens.length) {
    await DeviceToken.deleteMany({ token: { $in: staleTokens } });
  }

  return { sent, removed, skipped: false };
};

export default { isFcmConfigured, saveDeviceToken, removeDeviceToken, sendAnnouncementFcm };
