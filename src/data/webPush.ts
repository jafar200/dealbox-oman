/**
 * Web Push (متصفح/هاتف) — تسجيل Service Worker واشتراك الجهاز لاستقبال التنبيه العام.
 *
 * لا يعمل داخل WebView تطبيق الأندرويد (أندرويد لا يدعم Push API في WebView)،
 * لكنه يعمل في Chrome/Edge على الكمبيوتر وأندرويد، ويحتاج HTTPS (أو localhost).
 */

const SW_URL = '/sw.js';

export type WebPushStatus = 'unsupported' | 'default' | 'granted' | 'denied';

export const isWebPushSupported = (): boolean =>
  typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window;

export const getWebPushStatus = (): WebPushStatus => {
  if (!isWebPushSupported()) return 'unsupported';
  return Notification.permission as WebPushStatus;
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
};

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
  await navigator.serviceWorker.ready;
  return registration;
};

let cachedVapidKey: string | null = null;
const fetchVapidPublicKey = async (): Promise<string | null> => {
  if (cachedVapidKey) return cachedVapidKey;
  try {
    const response = await fetch('/api/v1/client/push/public-key');
    const result = await response.json();
    if (result?.success && result.publicKey) {
      cachedVapidKey = result.publicKey as string;
      return cachedVapidKey;
    }
  } catch {
    /* تجاهل — سيُعاد المحاولة لاحقاً */
  }
  return null;
};

const postSubscription = async (subscription: PushSubscription): Promise<void> => {
  const body = JSON.stringify(subscription.toJSON());
  await fetch('/api/v1/client/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
};

/**
 * تفعيل الإشعارات: يطلب الإذن (عند الحاجة) ثم يسجّل الاشتراك على الخادم.
 * يجب استدعاؤها من تفاعل مستخدم (زر/مفتاح) حتى يقبل المتصفح طلب الإذن.
 */
export const enableWebPush = async (): Promise<WebPushStatus> => {
  if (!isWebPushSupported()) return 'unsupported';

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;

  if (permission !== 'granted') return permission as WebPushStatus;

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return 'default';

  const registration = await registerServiceWorker();
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await postSubscription(subscription);
  return 'granted';
};

/** إيقاف الإشعارات: يلغي الاشتراك محلياً وعلى الخادم. */
export const disableWebPush = async (): Promise<void> => {
  if (!isWebPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/v1/client/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => undefined);
      await subscription.unsubscribe();
    }
  } catch {
    /* تجاهل */
  }
};

/**
 * مزامنة صامتة عند فتح التطبيق: إن كان الإذن ممنوحاً مسبقاً نعيد تسجيل
 * الاشتراك على الخادم (يفيد إن تغيّر الخادم أو فُقد الاشتراك المحلي).
 */
export const syncWebPushSubscription = async (): Promise<void> => {
  if (!isWebPushSupported() || Notification.permission !== 'granted') return;
  try {
    const registration = await registerServiceWorker();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await postSubscription(subscription);
    }
  } catch {
    /* تجاهل */
  }
};
