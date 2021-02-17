/* eslint-disable no-restricted-globals */

let cacheName = "guacamolePWA-v1";
caches.has(cacheName).then((res) => {
  if (res) {
    cacheName = "guacamolePWA-v2";
  }
});

/**
 * Install the service worker
 * JavaScript files and assets (e.g. images) are cached
 */
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

/**
 * Activate the service worker
 * Older versions of the cache (with a different cache name than the current one) are deleted.
 */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.filter((key) => key !== cacheName).map((key) => caches.delete(key))
      );
    })
  );
});

/**
 * Fetch resources
 * If it is a call to the API, it is performed as usual
 * Otherwise, either the resource is cached and returned to the user, or the resource is not
 * cached, it is cached and returned.
 */
self.addEventListener("fetch", (e) => {
  const currentLocation = self.location.origin;
  if (
    !e.request.url.startsWith("http") ||
    new RegExp(`^${currentLocation}/api/v[1-9][0-9]*/`).test(e.request.url)
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => {
      if (res) {
        return res;
      }

      return fetch(e.request).then((r) => {
        if (!r || r.status !== 200 || r.type !== "basic") {
          return r;
        }
        const newResource = r.clone();
        caches.open(cacheName).then((cache) => {
          console.info(`[Service Worker] Caching new resource: ${e.request.url}`);
          cache.put(e.request, newResource).catch(() => console.error("Can't cache new resource"));
        });
        return r;
      });
    })
  );
});

/**
 * Message sent from the client to the service-worker
 */
self.addEventListener("message", (e) => {
  if (e.data.type && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/**
 * Handle user click on a notification
 */
self.addEventListener("notificationclick", () => {
  console.log("Hello, World!");
});
