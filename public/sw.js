// Service Worker for caching assets
// NOTE: Cache strategy must allow JS/CSS updates, otherwise users can get stuck on old app versions.

const CACHE_NAME = 'bolt-mining-v2';
const STATIC_CACHE = 'static-v2';
const IMAGE_CACHE = 'images-v2';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/images/currency/ton.png',
  '/images/currency/usdt.svg',
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // Take over immediately so new code can be used without manual cache clearing
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip backend API calls - always fetch fresh
  if (url.hostname.includes('supabase.co')) return;

  // Handle image requests
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // IMPORTANT: JS/CSS must NOT be cache-first forever, otherwise updates never reach users.
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Handle HTML - network first
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
