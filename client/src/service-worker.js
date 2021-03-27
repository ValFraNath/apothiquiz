import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

/* eslint-disable no-restricted-globals */

/**
 * Install the service worker
 */
self.addEventListener("install", (e) => {
  console.info("[Service Worker] Install");
});

/*
 * When the service-worker is installed, Workbox precache all /static files
 */
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Activate the service worker
 * Older versions of the cache (with a different cache name than the current one) are deleted.
 */
self.addEventListener("activate", (e) => {
  console.info("[Service Worker] Activate");
});

function matchRegularRoute({ url }) {
  return !url.pathname.startsWith("/api");
}

registerRoute(matchRegularRoute, new StaleWhileRevalidate());

/**
 * Fetch resources
 * If it is a call to the API, it is performed as usual
 * Otherwise, either the resource is cached and returned to the user, or the resource is not
 * cached, it is cached and returned.
 */

self.addEventListener("message", (e) => {
  if (e.data.type && e.data.type === "SKIP_WAITING") {
    self
      .skipWaiting()
      .catch((err) => console.error("Error: can't skip waiting service-worker", err));
  }
});
