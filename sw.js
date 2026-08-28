// ====== sw.js — ФИНАЛЬНАЯ ВЕРСИЯ ======

const CACHE_NAME = 'skycitadel-v11';
const OFFLINE_URL = '/offline.html';

// ====== УСТАНОВКА ======
self.addEventListener('install', (event) => {
  console.log('✅ SW установлен');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

// ====== АКТИВАЦИЯ ======
self.addEventListener('activate', (event) => {
  console.log('✅ SW активирован');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кеш:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ====== ПЕРЕХВАТ ЗАПРОСОВ ======
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const request = event.request;

  // ====== НЕ КЕШИРУЕМ API И БЭКЕНД-ЗАПРОСЫ ======
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/spotify/') ||
    url.pathname.startsWith('/announcements') ||
    url.pathname.startsWith('/smlog') ||
    url.pathname.startsWith('/smreg') ||
    url.pathname.startsWith('/posts') ||
    url.pathname.startsWith('/account/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/video/') ||
    url.pathname.startsWith('/chat/')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // ====== ОБРАБОТКА НАВИГАЦИОННЫХ ЗАПРОСОВ (HTML-страницы) ======
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // ====== ДЛЯ ВСЕХ ОСТАЛЬНЫХ ЗАПРОСОВ (CSS, JS, картинки) ======
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          console.log(`📦 Из кеша: ${url.pathname}`);
          return cached;
        }
        return fetch(request);
      })
  );
});

// ====== PUSH-УВЕДОМЛЕНИЯ ======
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'SkyCitadel', body: 'Новое уведомление' };
  }
  const options = {
    body: data.body || 'Новое уведомление',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'SkyCitadel', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
