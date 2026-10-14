import webpush from 'web-push';
import { ENV } from '../config/env.js';
import PushSubscription from '../models/PushSubscription.js';

/**
 * إشعارات Web Push للمتصفح/الهاتف.
 * تُفعّل عند ضبط مفاتيح VAPID في بيئة الخادم؛ وإلا تعمل بقية الميزات بشكل عادي
 * وتُتخطّى الإشعارات بهدوء (بدون كسر أي مسار آخر).
 */

const isConfigured = Boolean(ENV.VAPID_PUBLIC_KEY && ENV.VAPID_PRIVATE_KEY);

if (isConfigured) {
  webpush.setVapidDetails(ENV.VAPID_SUBJECT, ENV.VAPID_PUBLIC_KEY, ENV.VAPID_PRIVATE_KEY);
} else {
  console.warn('[DealBox WebPush] VAPID keys missing — browser push notifications are disabled. '
    + 'Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
}

export const isWebPushConfigured = () => isConfigured;

export const getVapidPublicKey = () => ENV.VAPID_PUBLIC_KEY;

/** حفظ/تحديث اشتراك جهاز واحد (نفس الـendpoint لا يتكرر). */
export const saveSubscription = async ({ endpoint, keys, userAgent }) => {
  await PushSubscription.updateOne(
    { endpoint },
    {
      $set: {
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: userAgent || '',
        lastSeenAt: new Date(),
      },
    },
    { upsert: true },
  );
};

/** إزالة اشتراك (عند إيقاف المستخدم للإشعارات). */
export const removeSubscription = async (endpoint) => {
  if (!endpoint) return;
  await PushSubscription.deleteOne({ endpoint });
};

/**
 * إرسال التنبيه العام لكل الأجهزة المشتركة.
 * الاشتراكات المنتهية (404/410) تُحذف تلقائياً.
 * لا ترمي استثناءً — الفشل لا يجب أن يعطّل نشر التنبيه.
 */
export const sendAnnouncementPush = async ({ title, body, url }) => {
  if (!isConfigured) return { sent: 0, removed: 0, skipped: true };

  const subscriptions = await PushSubscription.find().lean();
  if (!subscriptions.length) return { sent: 0, removed: 0, skipped: false };

  const payload = JSON.stringify({
    title: title || 'DealBox عُمان',
    body: body || '',
    url: url || '/?portal=client',
    tag: 'dealbox-announcement',
  });

  let sent = 0;
  let removed = 0;
  const staleEndpoints = [];

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload,
      );
      sent += 1;
    } catch (error) {
      const status = error?.statusCode;
      if (status === 404 || status === 410) {
        staleEndpoints.push(sub.endpoint);
        removed += 1;
      } else {
        console.warn('[DealBox WebPush] Failed to send push:', status || error?.message || error);
      }
    }
  }));

  if (staleEndpoints.length) {
    await PushSubscription.deleteMany({ endpoint: { $in: staleEndpoints } });
  }

  return { sent, removed, skipped: false };
};

export default { isWebPushConfigured, getVapidPublicKey, saveSubscription, removeSubscription, sendAnnouncementPush };
