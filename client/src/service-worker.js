/* eslint-disable no-restricted-globals */

// Import Firebase scripts
import firebase from "firebase";

// Import firebase scripts
self.importScripts("https://www.gstatic.com/firebasejs/8.2.9/firebase-app.js");
self.importScripts("https://www.gstatic.com/firebasejs/8.2.9/firebase-messaging.js");

let cacheName = "guacamolePWA-v1";
caches.has(cacheName).then((res) => {
  if (res) {
    cacheName = "guacamolePWA-v2";
  }
});

// Initialize app with firebase data
// You can create a project and get these data here: https://firebase.google.com/
firebase.initializeApp({
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
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
  // User wants to use the new sw
  if (e.data.type && e.data.type === "SKIP_WAITING") {
    self.skipWaiting().catch(() => console.error("Can't skip waiting"));
  }
});

/**
 * Push message handling (app on background)
 * Use functions from firebase API
 */
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  // A notification must have a title
  if (!payload.data.title) {
    console.error("Can't display notification without title");
    return;
  }

  const { title } = payload.data;
  const options = {
    body: payload.data.body,
    icon: payload.data.image,
    data: payload.data,
  };

  // Show notification
  self.registration
    .showNotification(title, options)
    .catch((err) => console.error("Can't send notification: ", err));
});

/**
 * Handle user click on a notification
 * Display the duel page id linked to the notification
 */
self.addEventListener("notificationclick", (e) => {
  const { notification, action } = e;
  if (action === "close") {
    notification.close();
    return;
  }

  const { data } = notification;
  if (data.type === "duel" && data.duelId) {
    // eslint-disable-next-line no-undef
    clients
      .openWindow(`/duel/${data.duelId}`)
      .catch(() => console.error("Can't open window after the user clicks on a notification"));
    notification.close();
  }
});
