/* Service worker — offline play + safe updates.
   Strategy that avoids the stale-cache trap:
   - the page itself (navigations): NETWORK FIRST, cache as offline fallback
   - hashed build assets (/assets/*-<hash>.*): CACHE FIRST, immutable by name
   - music + icons (stable names): cache first, busted by the VERSION below
   Bump VERSION on every deploy (the build stamps it). */

const VERSION = 'smw-v2.0.0';
const SHELL = ['./', 'index.html', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // navigations: network first so updates land; cache fallback so car rides work
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match('./')))
    );
    return;
  }

  // everything else: cache first (hashed assets are immutable; stable names are version-keyed)
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
