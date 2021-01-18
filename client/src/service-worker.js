/* eslint-disable no-restricted-globals */

const cacheName = "guacamolePWA-v1";

self.addEventListener("install", (e) => {
  console.info("[Service Worker] Install");

  const contentToCache = self.__WB_MANIFEST;
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      console.info("[Service Worker] Caching all");
      return cache.addAll(contentToCache.map((value) => value.url));
    })
  );
});

self.addEventListener("fetch", (e) => {
  const currentLocation = self.location.origin;
  if (new RegExp(`^${currentLocation}/api/v[1-9][0-9]*/`).test(e.request.url)) {
    console.info("[Service Woker] Own API fetched");
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => {
      console.info(`[Service Worker] Fetching resource: ${e.request.url}`);
      return (
        res ||
        fetch(e.request).then((r) => {
          return caches.open(cacheName).then((cache) => {
            console.info(`[Service Worker] Caching new resource: ${e.request.url}`);
            cache.put(e.request, r.clone());
            return r;
          });
        })
      );
    })
  );
});
