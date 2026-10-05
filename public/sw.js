// Date_Where Service Worker - Background Notification Support
// Phien ban: 2.0 - Ho tro thong bao nen khi ung dung bi thu nho hoac tat

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
  try {
    const data = event.data.json();
    const title = data.title || 'Date_Where';
    const options = {
      body: data.body || '',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/favicon.svg',
      vibrate: [200, 100, 200],
      tag: data.tag || 'date-where',
      renotify: true,
      data: data.data || {},
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('[SW] Push event parse error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
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
          return clients.openWindow('/');
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});
