// Service Worker for XTC Converter PWA
// Caching strategy:
//   WASM + JS: Cache-First (版本寫在檔名，cache busting 靠檔名更新)
//   CDN (JSZip): Cache-First，7 天過期
//   HTML/CSS: Network-First (每次拿最新)
//   Font: Cache-First (字型幾乎不會改)

const CACHE_VERSION = 'xtc-converter-v1';

// 預快取清單：離線時也能用的核心檔案
const PRECACHE_URLS = [
  './',
  './index.html',
  './style-helloruru.css',
  './css/main.css',
  './css/variables.css',
  './css/base.css',
  './css/cards.css',
  './css/sidebar.css',
  './css/dropzone.css',
  './css/preview.css',
  './css/progress.css',
  './css/onboarding.css',
  './css/tutorial.css',
  './css/credits.css',
  './css/footer.css',
  './css/dark-mode.css',
  './css/responsive.css',
  './app.js',
  './app-bridge.js',
  './font-config.js',
  './format-handlers.js',
  './markdown-parser.js',
  './status-bar-themes.js',
  './image-tools.js',
  './crengine.js',
  './crengine.wasm',
  './dither-worker.js',
  './i18n-zh-TW.js',
];

// CDN 資源（JSZip）
const CDN_CACHE_NAME = 'xtc-cdn-v1';
const CDN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// ----- Install: 預快取核心資源 -----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ----- Activate: 清掉舊版快取 -----
self.addEventListener('activate', (event) => {
  const keepCaches = [CACHE_VERSION, CDN_CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !keepCaches.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ----- Fetch: 依資源類型選策略 -----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 只處理 GET
  if (event.request.method !== 'GET') return;

  // 判斷資源類型
  if (isCDN(url)) {
    event.respondWith(cdnCacheFirst(event.request));
  } else if (isWasmOrJS(url)) {
    event.respondWith(cacheFirst(event.request));
  } else if (isFont(url)) {
    event.respondWith(cacheFirst(event.request));
  } else if (isHTMLorCSS(url)) {
    event.respondWith(networkFirst(event.request));
  } else {
    // 其他靜態資源：Cache-First
    event.respondWith(cacheFirst(event.request));
  }
});

// ----- 策略實作 -----

// Cache-First：快取有就回，沒有才 fetch
function cacheFirst(request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
    })
  );
}

// Network-First：先 fetch，失敗才回快取（HTML/CSS 用）
function networkFirst(request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => cache.match(request))
  );
}

// CDN Cache-First（帶過期機制）
function cdnCacheFirst(request) {
  return caches.open(CDN_CACHE_NAME).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) {
        // 檢查是否過期
        const dateHeader = cached.headers.get('sw-cached-at');
        if (dateHeader) {
          const cachedAt = parseInt(dateHeader, 10);
          if (Date.now() - cachedAt < CDN_MAX_AGE_MS) {
            return cached;
          }
        } else {
          // 沒有時間戳，直接回快取（下次 fetch 會更新）
          return cached;
        }
      }
      // 沒快取或已過期：重新 fetch
      return fetch(request).then((response) => {
        if (response.ok) {
          // 複製 response 加上時間戳
          const headers = new Headers(response.headers);
          headers.set('sw-cached-at', String(Date.now()));
          const timestamped = new Response(response.clone().body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers,
          });
          cache.put(request, timestamped);
        }
        return response;
      }).catch(() => {
        // 網路失敗，回過期快取總比沒有好
        if (cached) return cached;
        return new Response('CDN resource unavailable', { status: 503 });
      });
    })
  );
}

// ----- URL 分類 -----

function isCDN(url) {
  return url.hostname === 'cdnjs.cloudflare.com' ||
         url.hostname === 'cdn.jsdelivr.net' ||
         url.hostname === 'unpkg.com';
}

function isWasmOrJS(url) {
  const path = url.pathname;
  return path.endsWith('.wasm') || path.endsWith('.js');
}

function isFont(url) {
  const path = url.pathname.toLowerCase();
  return path.endsWith('.woff2') ||
         path.endsWith('.woff') ||
         path.endsWith('.ttf') ||
         path.endsWith('.otf');
}

function isHTMLorCSS(url) {
  const path = url.pathname;
  return path.endsWith('.html') ||
         path.endsWith('.css') ||
         path === '/' ||
         path.endsWith('/');
}
