// Client Tracker Pro — Service Worker
// Strategy: Network-first, falling back to cache when offline.
// This lets the app always load the newest version when online,
// while still working fully offline once it has been opened at least once.

const CACHE_NAME = 'client-tracker-pro-v1';
const APP_SHELL = ['./', './index.html'];

// Install: pre-cache the app shell so the very first offline launch works.
self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () {
        // If pre-caching fails (e.g. wrong path), don't block install —
        // the fetch handler will still populate the cache on first real visit.
      });
    })
  );
});

// Activate: clean up any old cache versions from previous releases.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: try the network first (so updates are picked up immediately),
// and cache every successful response. If the network fails (offline),
// serve the last cached version instead — falling back to the cached
// index.html for navigation requests so the app shell always loads.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseCopy);
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return undefined;
        });
      })
  );
});
