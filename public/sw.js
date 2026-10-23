/* Lightweight app-shell service worker for the Next.js App Router. */
const SW_VERSION = 'nurani-pwa-v7';
const APP_SHELL_CACHE = `${SW_VERSION}-shell`;
const API_CACHE = `${SW_VERSION}-api`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const APP_SHELL_URLS = ['/', '/offline.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_SHELL_CACHE);
    await Promise.all(APP_SHELL_URLS.map(async (url) => {
      try { await cache.add(new URL(url, self.location.origin).toString()); } catch { /* A failed optional asset must not block installation. */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('nurani-pwa-') && ![APP_SHELL_CACHE, API_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Let Next.js build assets use its own immutable filenames/browser cache.
  // Never cache these in our runtime cache: stale dev chunks can cause hydration errors.
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/')) return;

  // The doa catalogue uses network-first so a malformed older API response is not
  // preferred forever; fall back to cache only when offline. Other API reads remain
  // stale-while-revalidate for quick offline-friendly Quran and prayer access.
  if (url.hostname === 'equran.id' || url.hostname === 'api.myquran.com') {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      const isDuaRequest = url.hostname === 'equran.id' && /\/api\/doa(?:\/|$)/.test(url.pathname);
      if (isDuaRequest) {
        try {
          const response = await fetch(request);
          if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
          if (response && response.ok) return response;
        } catch { /* Use saved data when offline. */ }
        return (await cache.match(request)) || new Response(JSON.stringify({ offline: true, message: 'Daftar doa belum tersimpan di perangkat.' }), { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      }
      const cached = await cache.match(request);
      const network = fetch(request).then((response) => {
        if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).catch(() => {});
        return response;
      }).catch(() => null);
      return cached || await network || new Response(JSON.stringify({ offline: true, message: 'Data belum tersimpan untuk akses offline.' }), { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    })());
    return;
  }

  // Keep local app assets warm; navigation falls back to the saved app shell.
  if (url.origin === self.location.origin && request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(new URL('/', self.location.origin).toString(), response.clone()).catch(() => {});
        return response;
      } catch {
        return (await cache.match(request)) || (await cache.match(new URL('/', self.location.origin).toString())) || (await cache.match(new URL('/offline.html', self.location.origin).toString())) || Response.error();
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok && (request.destination === 'style' || request.destination === 'script' || request.destination === 'image' || url.pathname.startsWith('/_next/static/'))) {
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        return cached || Response.error();
      }
    })());
  }
});
