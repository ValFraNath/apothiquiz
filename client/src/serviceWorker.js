// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://bit.ly/CRA-PWA

export function register(config) {
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      registerValidSW(swUrl, config);
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((reg) => {
      // Check if a new service worker is waiting
      if (reg.waiting) {
        console.info("[Client: sw] A new service worker is waiting");
        if (config && config.onWaiting) {
          config.onWaiting(reg.waiting);
        }
      }

      // A new worker appeared in reg.installing
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker == null) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.info("[Client: sw] New content available, update possible");
              if (config && config.onUpdate) {
                config.onUpdate(newWorker);
              }
            } else {
              console.info("[Client: sw] New service-worker installed");
            }
          }
        });
      });
    })
    .catch((error) => {
      console.error(`[Client: sw] Error during service worker registration: ${error}`);
    });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
