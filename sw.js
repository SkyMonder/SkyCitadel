// ====== sw.js — С ЯВНЫМ СПИСКОМ СТРАНИЦ ======

const CACHE_NAME = 'skycitadel-v9';
const OFFLINE_URL = '/offline.html';

// ====== ВСЕ СТРАНИЦЫ, КОТОРЫЕ НУЖНО ЗАКЕШИРОВАТЬ ======
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/welcome.html',
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
  '/stats.html',
  '/privacy.html',
  '/terms.html',
  '/no-data.html',
  '/support.html',
  '/manifest.json'
];

// ====== УСТАНОВКА ======
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker установлен');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        // Кешируем каждый файл отдельно с логами
        for (const url of STATIC_ASSETS) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`✅ Закеширован: ${url}`);
            } else {
              console.warn(`⚠️ Не закеширован: ${url} (статус ${response.status})`);
            }
          } catch (err) {
            console.warn(`❌ Ошибка кеширования: ${url}`, err);
          }
        }
        console.log('✅ Все файлы обработаны');
      })
      .then(() => self.skipWaiting())
  );
});

// ====== АКТИВАЦИЯ ======
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker активирован');
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

  // API и внешние запросы не кешируем
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кешируем успешные HTML-ответы для будущих офлайн-сессий
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => {
        // При ошибке сети — ищем в кеше
        return caches.match(event.request)
          .then((cached) => {
            if (cached) {
              console.log(`📦 Отдаём из кеша: ${url.pathname}`);
              return cached;
            }
            console.log(`📄 Отдаём офлайн-страницу для: ${url.pathname}`);
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
