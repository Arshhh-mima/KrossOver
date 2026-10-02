const CACHE_NAME = "krossover-v3";
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/lion-logo.svg",
  "/assets/generated/lion-logo.dim_512x512.png",
];

// URLs to never cache (backend canister / API calls)
function shouldSkipCache(url) {
  return (
    url.includes("icp0.io") ||
    url.includes("ic0.app") ||
    url.includes("raw.icp0.io") ||
    url.includes("blob.caffeine.ai") ||
    url.includes("caffeine.ai/api") ||
    url.startsWith("chrome-extension://")
  );
}

// Install: precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS).catch(() => {
          // Ignore errors from optional URLs
        }),
      )
      .then(() => self.skipWaiting()),
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: navigation = network-first with offline fallback; assets = cache-first
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  if (request.method !== "GET" || shouldSkipCache(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() =>
          caches
            .match("/")
            .then((cached) => cached || caches.match("/offline.html")),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        }),
    ),
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = { title: "KrossOver", body: "You have a new notification" };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "New activity on KrossOver",
    icon: "/assets/generated/lion-logo.dim_512x512.png",
    badge: "/lion-logo.svg",
    vibrate: [100, 50, 100],
    data: data,
    actions: [
      { action: "open", title: "Open KrossOver" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "KrossOver", options),
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
  );
});
