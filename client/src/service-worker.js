import { setCacheNameDetails } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

/* eslint-disable no-restricted-globals */

/*
 * Configure the workbox cache
 */
setCacheNameDetails({
  prefix: "guacamole",
  suffix: "v1",
});

/**
 * Install event
 */
self.addEventListener("install", (e) => {
  console.info("[Service Worker] Install");
});

/*
 * When the service-worker is installed, Workbox precache all /static files
 */
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Activate event
 */
self.addEventListener("activate", (e) => {
  console.info("[Service Worker] Activate");
});

/**
 * Fetch resources
 * TODO: Blabla
 */
const matchRouteToCache = ({ url }) => !url.pathname.startsWith("/api");
registerRoute(matchRouteToCache, new StaleWhileRevalidate());
