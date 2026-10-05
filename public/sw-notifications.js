// Date_Where - Push and Notification Click Handlers
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'Date_Where';
    const options = {
      body: data.body || '',
      icon: data.icon || '/Date_Where/pwa-192x192.png',
      badge: data.badge || '/Date_Where/favicon.svg',
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
