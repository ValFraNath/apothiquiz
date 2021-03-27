import { BackgroundSyncPlugin } from "workbox-background-sync";
import { setCacheNameDetails } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";

/* eslint-disable no-restricted-globals */
// needed for variable self

/*
 * Configure the workbox cache name
 */
setCacheNameDetails({
  prefix: "guacamole",
  suffix: "v1",
});

/**
 * Install event
 */
self.addEventListener("install", () => {
  console.info("[Service Worker] Install");
});

/*
 * When the service-worker is installed, Workbox precache all /static files
 */
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Activate event
 */
self.addEventListener("activate", () => {
  console.info("[Service Worker] Activate");
});

/**
 * Fetch resources
 * Workbox responds with the files in the cache, and then updates them through the network
 * API requests are not cached
 */
const matchRouteToCache = ({ url }) => !url.pathname.startsWith("/api");
registerRoute(matchRouteToCache, new StaleWhileRevalidate());

/*
 * Background Sync
 */
const bgSyncPlugin = new BackgroundSyncPlugin("apiQueue", {
  maxRetentionTime: 24 * 60, // retry for max 24 hours
});
const matchRouteBackgroundSync = ({ url }) => url.pathname.startsWith("/api");
registerRoute(matchRouteBackgroundSync, new NetworkOnly({ plugins: [bgSyncPlugin] }));
