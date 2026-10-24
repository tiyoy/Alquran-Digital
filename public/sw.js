/* Lightweight app-shell service worker for the Next.js App Router. */
const SW_VERSION = 'nurani-pwa-v31';
const APP_SHELL_CACHE = `${SW_VERSION}-shell`;
const API_CACHE = `${SW_VERSION}-api`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const APP_SHELL_URLS = ['/', '/pencarian', '/quran', '/quran/1-al-fatihah', '/quran/1-al-fatihah/1', '/jadwal-shalat', '/doa', '/doa/1-doa-sebelum-makan', '/doa/2-doa-sesudah-makan', '/doa/3-doa-sebelum-tidur', '/doa/4-doa-bangun-tidur', '/doa/5-doa-memohon-kebaikan', '/asmaul-husna', '/arah-kiblat', '/offline.html', '/manifest.webmanifest', '/favicon.svg'];

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

function isSurahRouteForId(pathname, surahId) {
  const number = Number(surahId);
  if (!Number.isInteger(number) || number < 1 || number > 114) return false;
  return new RegExp(`^/quran/${number}-[a-z0-9-]+(?:/\\d+)?/?$`, 'i').test(String(pathname || ''));
}

async function cacheSurahReaderRoutes(message) {
  const surahId = Number(message?.surahId);
  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114 || !Array.isArray(message?.paths)) return;
  const cache = await caches.open(APP_SHELL_CACHE);
  await Promise.all(message.paths.slice(0, 2).map(async (path) => {
    let routeUrl;
    try { routeUrl = new URL(String(path), self.location.origin); } catch { return; }
    if (routeUrl.origin !== self.location.origin || !isSurahRouteForId(routeUrl.pathname, surahId)) return;
    // Save an HTML document response for direct offline navigation. This is best effort;
    // localStorage verse rows remain the main fallback inside the running app.
    try {
      const response = await fetch(routeUrl.href, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
      });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && /text\/html/i.test(contentType)) await cache.put(routeUrl.href, response.clone());
    } catch { /* An offline page can still use the pinned local verse data. */ }
  }));
}

async function removeSurahOfflineCache(surahId) {
  const number = Number(surahId);
  if (!Number.isInteger(number) || number < 1 || number > 114) return;
  const shell = await caches.open(APP_SHELL_CACHE);
  const shellRequests = await shell.keys();
  await Promise.all(shellRequests.map(async (request) => {
    const url = new URL(request.url);
    if (url.origin === self.location.origin && isSurahRouteForId(url.pathname, number)) await shell.delete(request);
  }));

  const api = await caches.open(API_CACHE);
  const apiRequests = await api.keys();
  await Promise.all(apiRequests.map(async (request) => {
    const url = new URL(request.url);
    const quranSurahEndpoint = url.hostname === 'equran.id' && new RegExp(`/surat/${number}(?:/|$)`).test(url.pathname);
    if (quranSurahEndpoint) await api.delete(request);
  }));
}

async function clearQuranOfflineCache() {
  const shell = await caches.open(APP_SHELL_CACHE);
  const shellRequests = await shell.keys();
  await Promise.all(shellRequests.map(async (request) => {
    const url = new URL(request.url);
    if (url.origin === self.location.origin && /^\/quran\/\d+-[a-z0-9-]+(?:\/\d+)?\/?$/i.test(url.pathname)) await shell.delete(request);
  }));
  const api = await caches.open(API_CACHE);
  const apiRequests = await api.keys();
  await Promise.all(apiRequests.map(async (request) => {
    const url = new URL(request.url);
    if (url.hostname === 'equran.id' && /\/surat\/\d+(?:\/|$)/.test(url.pathname)) await api.delete(request);
  }));
}

self.addEventListener('message', (event) => {
  const message = event.data || {};
  if (message.type === 'CACHE_SURAH_ROUTES') {
    event.waitUntil(cacheSurahReaderRoutes(message));
  } else if (message.type === 'REMOVE_SURAH_OFFLINE') {
    event.waitUntil(removeSurahOfflineCache(message.surahId));
  } else if (message.type === 'CLEAR_QURAN_OFFLINE') {
    event.waitUntil(clearQuranOfflineCache());
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Production Next.js assets use content-hashed filenames. Cache-first is safe for
  // those immutable files and makes an already-installed PWA boot when offline.
  // The active cache namespace is versioned; activation removes stale deployment caches.
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }
  // Framework and SEO metadata routes must bypass runtime caching. Otherwise a
  // direct navigation to robots.txt/sitemap.xml could be cached as the app shell.
  // Streamed audio downloads must stay network-only; never wrap/cache the large proxy response here.
  if (url.origin === self.location.origin && (url.pathname === '/api/audio-proxy' || url.pathname === '/api/quran-search')) return;

  // Tajweed annotations are optional but may be cached after first use so the
  // last few annotated surahs can still be rendered offline by the client cache.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/tajweed/')) {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(request);
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch {
        return cached || new Response(JSON.stringify({ ok: false, message: 'Data tajwid belum tersimpan di cache browser.' }), { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      }
    })());
    return;
  }

  if (url.origin === self.location.origin && (
    url.pathname.startsWith('/_next/') ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/og-nurani.png' ||
    url.pathname === '/google47c4b90e54eddd18.html'
  )) return;

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

  // Cache successful document navigations under their exact URL. This makes
  // previously visited surah detail routes available offline without overwriting
  // the cached homepage with whichever page happened to be opened last.
  if (url.origin === self.location.origin && request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch {
        return (await cache.match(request, { ignoreVary: true })) || (await cache.match(new URL('/', self.location.origin).toString(), { ignoreVary: true })) || (await cache.match(new URL('/offline.html', self.location.origin).toString(), { ignoreVary: true })) || Response.error();
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
