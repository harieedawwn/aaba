// Network-first for same-origin GET (cache fallback, so no version bumps needed);
// cache-first for pinned CDN URLs; offline navigations fall back to cached index.
const CACHE = 'aaba-rt-2';
const CDN = ['www.gstatic.com'];
const later = ms => new Promise(res => setTimeout(res, ms));
const keep = (e, p) => { try { e.waitUntil(p); } catch { /* event already finished */ } };

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('aaba-rt') && k !== CACHE).map(k => caches.delete(k)))).catch(() => {}).then(() => self.clients.claim())
));

// Slow network: after 4 s serve the cached copy if there is one, otherwise keep waiting for the network (never fail a cold load).
// cache:'no-cache' revalidates with the server so files of one deploy never mix with HTTP-cached files of the previous one.
async function networkFirst(e) {
  const req = e.request, c = await caches.open(CACHE);
  const net = fetch(req, { cache: 'no-cache' }).then(r => {
    if (r && r.ok) keep(e, c.put(req, r.clone()).catch(() => {}));
    return r;
  });
  const fallback = async () => (await c.match(req)) || (req.mode === 'navigate' && ((await c.match('./index.html')) || (await c.match('./'))));
  try {
    const r = await Promise.race([net, later(4000).then(() => null)]);
    if (r && r.ok) return r;
    const hit = await fallback();
    if (hit) { keep(e, net.catch(() => {})); return hit; }
    return r || await net;
  } catch (err) {
    const hit = await fallback();
    if (hit) return hit;
    throw err;
  }
}
async function cacheFirst(e) {
  const req = e.request, c = await caches.open(CACHE), hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r && r.ok) keep(e, c.put(req, r.clone()).catch(() => {}));
  return r;
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) e.respondWith(networkFirst(e));
  else if (CDN.includes(u.hostname) && u.pathname.startsWith('/firebasejs/')) e.respondWith(cacheFirst(e));
});
