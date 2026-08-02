/**
 * sw.js — cache-first service worker so CalcSuite is installable and works offline.
 * Tool modules are cached lazily the first time each route is visited.
 */
const CACHE = 'calcsuite-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/themes.css',
  './js/main.js',
  './js/router.js',
  './js/tools.js',
  './Assets/Favicon/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Never cache exchange-rate responses — the app caches those in localStorage itself.
  if (url.hostname.includes('exchangerate') || url.hostname.includes('frankfurter')) {
    event.respondWith(fetch(request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && url.origin === location.origin) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
