// ====== sw.js — ИСПРАВЛЕННАЯ ВЕРСИЯ ======

const CACHE_NAME = 'skycitadel-v5';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico'
  // style.css убрали — его нет на сайте
];

// ====== УСТАНОВКА: кешируем офлайн-страницу и статику ======
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker установлен');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Добавляем офлайн-страницу и основные файлы
        return cache.addAll(STATIC_ASSETS)
          .catch((err) => {
            console.warn('⚠️ Ошибка кеширования:', err);
            // Даже если часть файлов не закешировалась, продолжаем установку
          });
      })
      .then(() => {
        // Активируем сразу
        self.skipWaiting();
      })
  );
});

// ====== АКТИВАЦИЯ: очищаем старые кеши ======
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
    }).then(() => {
      // Принимаем контроль над всеми страницами
      return self.clients.claim();
    })
  );
});

// ====== ПЕРЕХВАТ ЗАПРОСОВ: стратегия "сначала сеть, при ошибке — кеш" ======
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Если запрос к API или внешнему ресурсу — пропускаем
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если ответ успешный — кешируем его (для будущих офлайн-сессий)
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Если сеть недоступна — пытаемся отдать из кеша
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Если ресурса нет в кеше — отдаём офлайн-страницу
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

// Клик по уведомлению
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
