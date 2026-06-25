const CACHE = 'taisen-format-v46';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./favicon-16.png','./favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  // Cross-origin (e.g. Google Sheets CSV): let the browser fetch directly, never cache.
  if (url.origin !== location.origin) return;
  // HTML / navigations: network-first so the latest version always loads when online.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then(resp => { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return resp; })
                .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // Other same-origin assets: cache-first.
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return resp; }))
  );
});
