const CACHE_NAME = 'c-cure-clinic-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/offline.html',
  '/mobile-logo.png',
  '/manifest.json',
  '/favicon.ico',
];

// Install Service Worker and cache essential offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate and remove old caches if any
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Intercept network fetch requests
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Handle page navigations (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOfflinePage = await cache.match(OFFLINE_URL);
        return cachedOfflinePage || Response.error();
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(async () => {
        // If an image fails to load while offline, try to fallback to logo
        if (event.request.destination === 'image') {
          const cache = await caches.open(CACHE_NAME);
          return cache.match('/mobile-logo.png');
        }
        return Response.error();
      });
    })
  );
});
