// SweetSync Couple Calendar - PWA Service Worker v3.8.0
const CACHE_NAME = 'couple-calendar-v3.8.0';
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
  './modules/realtime_sync.css',
  './modules/realtime_sync_engine.js',
  './modules/ledger_stats.css',
  './modules/ledger_seed_2026.js',
  './modules/excel_ledger_engine.js',
  './modules/ledger_stats_view.js',
  './modules/real_estate.css',
  './modules/real_estate_scraper.js',
  './modules/real_estate_map.js',
  './modules/real_estate_engine.js',
  './modules/real_estate_view.js',
  './modules/naver_radar.css',
  './modules/naver_radar_engine.js',
  './modules/naver_radar_view.js',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Install: Cache critical core shell assets immediately and skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches and take control of all clients immediately
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

  // 1. 비상 업데이트 엔드포인트
  if (requestUrl.pathname.includes('/emergency-update') || requestUrl.search.includes('purge-cache=1')) {
    event.respondWith(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[SW] All caches cleared via emergency endpoint');
        return new Response(JSON.stringify({ status: 'cleared', version: CACHE_NAME, timestamp: Date.now() }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })()
    );
    return;
  }

  // 2. Bypass Service Worker cache for GitHub Gist API sync, Firebase, & external POST/PATCH calls
  if (requestUrl.hostname.includes('github.com') || requestUrl.hostname.includes('firebaseio.com') || event.request.method !== 'GET') {
    return;
  }

  // 3. Network-first strategy for app resources
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
