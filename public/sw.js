// Date_Where Service Worker - Background Notification Support
// Phien ban: 2.1 - Ho tro thong bao nen khi ung dung bi thu nho hoac tat

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Date_Where service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Date_Where service worker activated.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let title = 'DateWhere 💕';
  let body = '';
  let url = '/Date_Where/';
  let tag = 'date-where';
  let icon = '/Date_Where/pwa-192x192.png';
  let badge = '/Date_Where/favicon.svg';

  try {
    const data = event.data.json();
    title = data.title || title;
    body = data.body || data.message || '';
    url = (data.data && data.data.url) || data.click || url;
    tag = data.tag || (data.id ? `dw-${data.id}` : 'date-where');
    icon = data.icon || icon;
    badge = data.badge || badge;
  } catch {
    body = event.data.text() || '';
  }

  const options = {
    body,
    icon,
    badge,
    vibrate: [250, 100, 250, 100, 400],
    tag,
    renotify: true,
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/Date_Where/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});
