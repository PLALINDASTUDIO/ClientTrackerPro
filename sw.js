const CACHE_NAME = 'budgetflow-pro-v2';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

// الشبكة أولاً: يجلب دائمًا أحدث نسخة عند توفر الإنترنت،
// ويحفظ نسخة منها للاستخدام لاحقًا بلا اتصال. يعود للتخزين المؤقت فقط إن تعذّر الاتصال بالشبكة.
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(function(response){
      const copy = response.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
      return response;
    }).catch(function(){
      return caches.match(event.request).then(function(cached){
        return cached || caches.match('./');
      });
    })
  );
});
