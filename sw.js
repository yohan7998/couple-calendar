// SweetSync Couple Calendar - PWA Service Worker v2.3.0
const CACHE_NAME = 'couple-calendar-v2.3.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './modules/modern_theme.css',
  './modules/modern_components.css',
  './modules/modern_icons.js',
  './modules/read_status.css',
  './modules/read_status_engine.js',
  './modules/brush_reveal.css',
  './modules/brush_reveal_effect.js',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Install: Cache critical core shell assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches and take control of all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First with Cache Fallback for dynamic app data freshness
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Bypass Service Worker cache for GitHub Gist API sync & external POST/PATCH calls
  if (requestUrl.hostname.includes('github.com') || event.request.method !== 'GET') {
    return;
  }

  // 2. Network-first strategy for app resources
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable (offline mode)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

