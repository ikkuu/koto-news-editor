/* ============================================================
   kotoedit Service Worker
   ------------------------------------------------------------
   役割：
   - PWA インストール要件を満たすための最低限の SW
   - 静的アセット（HTML/CSS/JS/icons）を network-first でキャッシュ
   - メディア素材（mp4/mov等）はキャッシュしない（容量大のため）
   ============================================================ */

const CACHE_VERSION = 'kotoedit-v7';
const CACHE_NAME = `${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './ios-audio-unlock.js',
  './script_updated.js',
  './sync-player.js',
  './playhead-drag.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

/* ---------- install ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // 個別の失敗で全体を止めない
        console.warn('[sw] precache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

/* ---------- activate ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ---------- fetch ---------- */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 同一オリジン以外（CDN等）はキャッシュしない
  if (url.origin !== self.location.origin) return;

  // メディアファイルはネットワーク優先（キャッシュなし）
  if (/\.(mp4|mov|mp3|wav|webm)(\?|$)/i.test(url.pathname)) return;

  // それ以外は network-first → fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 正常な応答のみキャッシュに保存
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
