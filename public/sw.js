const CACHE = 'sparq-v1';
const APP_SHELL = ['/', '/manifest.json', '/icon.svg', '/sparq-logo.jpg', '/reaction-respect.svg', '/reaction-proof.svg', '/reaction-rip.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const icon = payload.icon ? new URL(payload.icon, self.registration.scope).href : '/sparq-logo.jpg';
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Sparq', {
      body: payload.body || 'Your accountability partner sent an update.',
      icon,
      badge: payload.badge || '/sparq-logo.jpg',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const target = event.notification.data?.url || '/';
    const existing = windows.find((client) => 'focus' in client);
    if (existing) {
      existing.navigate(target);
      return existing.focus();
    }
    return clients.openWindow(target);
  }));
});
