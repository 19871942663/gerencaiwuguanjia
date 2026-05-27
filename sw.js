// sw.js — Service Worker（离线缓存）
var CACHE_NAME = "finance-pwa-v1";
var PRECACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/js/db.js",
  "/js/sync.js",
  "/js/ui.js",
  "/js/forms.js",
  "/js/statements.js",
  "/js/time-views.js",
  "/js/charts.js",
  "/lib/dexie.min.js",
  "/lib/chart.umd.min.js",
  "/manifest.json",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
