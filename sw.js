/*
 * DealBox عُمان — Web Push Service Worker
 * يستقبل إشعارات الدفع من الخادم ويعرضها كإشعار حقيقي في المتصفح/الهاتف،
 * ويفتح التطبيق عند الضغط على الإشعار.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'DealBox عُمان', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'DealBox عُمان';
  const options = {
    body: data.body || '',
    icon: '/push-icon.svg',
    badge: '/push-icon.svg',
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || 'dealbox-announcement',
    renotify: true,
    data: { url: data.url || '/?portal=client' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/?portal=client';

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if (client.url.indexOf('portal=client') !== -1 && 'focus' in client) {
        return client.focus();
      }
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow(target);
    }
    return undefined;
  })());
});
