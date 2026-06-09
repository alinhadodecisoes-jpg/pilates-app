const CACHE_NAME = 'daimach-v2';
const OFFLINE_URL = '/offline.html';

// Instalar
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/chat',
        '/login',
        '/offline.html',
      ]);
    })
  );
  self.skipWaiting();
});

// Ativar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Não cachear APIs
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match(OFFLINE_URL);
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Daimach.Movement', body: '', url: '/aluno/dashboard' };
  try {
    data = event.data.json();
  } catch (e) {
    data.body = event.data ? event.data.text() : '';
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/images/logo-oficial.jpeg',
      badge: '/images/logo-oficial.jpeg',
      data: { url: data.url || '/aluno/dashboard' },
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data.url || '/aluno/dashboard');
    })
  );
});
