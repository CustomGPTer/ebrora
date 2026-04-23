// public/site-photo-stamp/sw.js
//
// Minimal service worker for the Site Photo Stamp PWA.
//
// Purpose:
//   1. Meet Chrome / Chromium's installability criteria (a registered SW
//      with a fetch handler is required before `beforeinstallprompt` fires).
//   2. Make the app shell (landing page + manifest + icons) available
//      offline so the installed PWA still opens without a connection.
//
// Deliberately conservative:
//   • Does NOT cache Next.js JS chunks, CSS, or API calls — those go
//     through the network untouched. This avoids the classic "stale SW
//     serves last week's chunks and the app breaks after deploy" trap.
//   • Only intercepts navigation requests under /site-photo-stamp/ plus
//     the manifest + icon static assets.
//   • Cache is versioned — bump CACHE_NAME to invalidate on next install.

const CACHE_NAME = "spstamp-shell-v1";
const SHELL_URL = "/site-photo-stamp/";
const PRECACHE_URLS = [
  "/site-photo-stamp/manifest.webmanifest",
  "/site-photo-stamp/icon-192.png",
  "/site-photo-stamp/icon-512.png",
  "/site-photo-stamp/icon-512-maskable.png",
  "/site-photo-stamp/icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Using individual puts so one 404 doesn't abort the whole install.
      Promise.all(
        PRECACHE_URLS.map((url) =>
          fetch(url, { cache: "no-cache" })
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests (the app shell): network-first, fall back to the
  // cached landing page so the PWA opens offline. We intentionally cache
  // successful navigations so the first offline load has something to show.
  if (req.mode === "navigate" && url.pathname.startsWith("/site-photo-stamp")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(SHELL_URL, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(SHELL_URL).then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // Manifest + icons: cache-first so installability stays reliable even on
  // a flaky connection.
  if (
    url.pathname.startsWith("/site-photo-stamp/icon-") ||
    url.pathname === "/site-photo-stamp/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }

  // Everything else (Next.js chunks, images outside /site-photo-stamp,
  // analytics, etc.) falls through untouched.
});
