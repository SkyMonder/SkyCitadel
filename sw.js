self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('skycitadel-v1').then((cache) => {
      return cache.addAll(['/', '/index.html', '/skymessage.html', '/socnet.html', '/gazeta.html']);
    })
  );
});
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
