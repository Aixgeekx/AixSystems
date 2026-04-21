// Service Worker - 预缓存 index + 静态资源,运行时缓存图片/音频;Stale-While-Revalidate 策略
const VERSION = 'v2-2026-04';                                // 升级此值会重新激活 SW
const PRECACHE = 'aixsystems-precache-' + VERSION;
const RUNTIME = 'aixsystems-runtime-' + VERSION;

const PRECACHE_URLS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PRECACHE).then(c => c.addAll(PRECACHE_URLS)));
  self.skipWaiting();                                        // 立即激活
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== PRECACHE && k !== RUNTIME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                // 不拦截第三方

  // HTML: 网络优先,失败回退缓存(离线可用)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(PRECACHE).then(c => c.put('./index.html', copy));
        return r;
      }).catch(() => caches.match('./index.html').then(x => x || new Response('<h1>离线</h1>', { headers: { 'content-type': 'text/html' }})))
    );
    return;
  }

  // 静态资源: Stale-While-Revalidate
  if (['style', 'script', 'font', 'image', 'audio'].includes(req.destination)) {
    event.respondWith(
      caches.match(req).then(cached => {
        const net = fetch(req).then(r => {
          if (r.ok) caches.open(RUNTIME).then(c => c.put(req, r.clone()));
          return r;
        }).catch(() => cached || new Response('', { status: 504 }));
        return cached || net;
      })
    );
    return;
  }

  // 其他: 透传
  event.respondWith(fetch(req).catch(() => caches.match(req) as Promise<Response>));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
