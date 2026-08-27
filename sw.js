// ====== sw.js — ПОЛНАЯ ВЕРСИЯ ДЛЯ ВСЕХ СТРАНИЦ ======

const CACHE_NAME = 'skycitadel-v6';
const OFFLINE_URL = '/offline.html';

// ====== ВСЕ СТРАНИЦЫ ПРИЛОЖЕНИЯ ======
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/welcome.html',
  '/ban.html',
  '/offline.html',
  '/skymessage.html',
  '/socnet.html',
  '/skyvideo.html',
  '/map.html',
  '/settings.html',
  '/account.html',
  '/search.html',
  '/gazeta.html',
  '/skyai.html',
  '/music.html',
  '/radio.html',
  '/tv.html',
  '/photoshop.html',
  '/qr.html',
  '/stats.html',
  '/privacy.html',
  '/terms.html',
  '/no-data.html',
  '/support.html',
  '/favicon.ico',
  '/manifest.json',
  // если есть другие CSS/JS — добавь их сюда
];

// ====== УСТАНОВКА ======
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker установлен');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
          .catch((err) => {
            console.warn('⚠️ Ошибка кеширования некоторых файлов:', err);
            // Продолжаем установку даже если часть файлов не закешировалась
          });
      })
      .then(() => self.skipWaiting())
  );
});

// ====== АКТИВАЦИЯ ======
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker активирован');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кеш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ====== ПЕРЕХВАТ ЗАПРОСОВ ======
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API и внешние запросы не кешируем
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кешируем успешные ответы для будущих офлайн-сессий
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // При ошибке сети — ищем в кеше
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Если ничего нет — отдаём офлайн-страницу
            return caches.match(OFFLINE_URL);
          });
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
