const APP_CACHE = 'minizoo-app-v1';
const RUNTIME_CACHE = 'minizoo-runtime-v1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/bulusanstatue.glb',
  '/ambience.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== APP_CACHE && k !== RUNTIME_CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

function shouldCacheRequest(requestUrl) {
  const path = requestUrl.pathname;
  if (path.startsWith('/models/')) return true;
  if (path.startsWith('/assets/')) return true;
  return /\.(?:js|css|png|jpg|jpeg|webp|svg|gif|woff2?|glb|gltf|obj|mtl|mp3)$/i.test(path);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const network = await fetch(request);
        const cache = await caches.open(APP_CACHE);
        cache.put('/index.html', network.clone());
        return network;
      } catch {
        const cached = await caches.match('/index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  if (!shouldCacheRequest(url)) return;

  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);

    const networkPromise = fetch(request)
      .then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => null);

    if (cached) {
      networkPromise.catch(() => null);
      return cached;
    }

    const network = await networkPromise;
    return network || Response.error();
  })());
});
