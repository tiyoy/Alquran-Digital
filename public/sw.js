const SHELL_CACHE = 'aqdi-shell-v2';
const DATA_CACHE = 'aqdi-data-v1';
const AUDIO_CACHE = 'aqdi-offline-audio-v1';

const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const allowed = new Set([SHELL_CACHE, DATA_CACHE, AUDIO_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!allowed.has(key)) return caches.delete(key);
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Jangan intercept Next.js dev HMR / webpack / turbopack endpoints
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/webpack-hmr') ||
      url.pathname.startsWith('/__nextjs'))
  ) {
    return;
  }

  // 1. Offline Murottal Audio: Cache-First so downloaded surahs play 100% offline
  if (url.hostname === 'cdn.equran.id' && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        return fetch(request);
      })
    );
    return;
  }

  // 2. EQuran.id & MyQuran API: Network-First with Cache Fallback for offline reading
  if (url.hostname === 'equran.id' || url.hostname === 'api.myquran.com') {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const networkRes = await fetch(request);
          if (networkRes && networkRes.ok) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              code: 503,
              status: false,
              message: 'Mode offline: data belum tersimpan di cache perangkat.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      })
    );
    return;
  }

  // 3. Next.js static chunks: Network-First with Cache Fallback
  // Mencegah mismatch antara HTML baru dan JS chunk lama saat update/deploy
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        try {
          const networkRes = await fetch(request);
          if (networkRes && networkRes.ok) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        } catch {
          const cached = await cache.match(request);
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // 4. Google Fonts: Stale-While-Revalidate (immutable font files)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 5. App navigation requests: Network-First falling back to cached '/'
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, res.clone()));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/');
        })
    );
  }
});
