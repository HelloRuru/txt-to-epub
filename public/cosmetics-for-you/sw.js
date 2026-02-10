/**
 * Service Worker — Cosmetics For You
 * 快取策略：Stale-While-Revalidate（先返回快取，背景更新）
 */

const CACHE_VERSION = 'cosmetics-v1.0.0'
const CACHE_NAME = `${CACHE_VERSION}-static`

// 需要快取的關鍵檔案
const STATIC_ASSETS = [
  '/cosmetics-for-you/',
  '/cosmetics-for-you/index.html',
  '/cosmetics-for-you/manifest.json',
  '/cosmetics-for-you/css/base.css',
  '/cosmetics-for-you/css/layout.css',
  '/cosmetics-for-you/css/accessibility.css',
  '/cosmetics-for-you/css/responsive.css',
  '/cosmetics-for-you/css/components/hero.css',
  '/cosmetics-for-you/css/components/search.css',
  '/cosmetics-for-you/css/components/results.css',
  '/cosmetics-for-you/css/components/calculator.css',
  '/cosmetics-for-you/css/components/share.css',
  '/cosmetics-for-you/css/components/back-to-top.css',
  '/cosmetics-for-you/css/components/footer.css',
  '/cosmetics-for-you/js/main.js',
  '/cosmetics-for-you/js/state.js',
  '/cosmetics-for-you/js/core/render.js',
  '/cosmetics-for-you/js/core/search.js',
  '/cosmetics-for-you/js/data/brands.js',
  '/cosmetics-for-you/js/data/sources.js',
  '/cosmetics-for-you/js/data/nicknames.js',
  '/cosmetics-for-you/js/features/exchange.js',
  '/cosmetics-for-you/js/features/share.js',
  '/cosmetics-for-you/js/features/back-to-top.js',
  '/cosmetics-for-you/js/utils/icons.js',
  // 字體（CDN）
  'https://lab.helloruru.com/fonts/GenSenRounded-Medium.woff2',
  'https://lab.helloruru.com/fonts/GenSenRounded-Regular.woff2',
  'https://lab.helloruru.com/fonts/GenSenRounded-Bold.woff2',
  // 品牌 Header
  'https://lab.helloruru.com/shared/brand-header.js'
]

// Install：安裝 Service Worker 時預先快取關鍵檔案
self.addEventListener('install', (event) => {
  console.log('[SW] Install event')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting() // 立即啟用新的 SW
    })
  )
})

// Activate：清除舊版本的快取
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim() // 立即控制所有頁面
    })
  )
})

// Fetch：攔截網路請求，使用快取策略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只處理 GET 請求
  if (request.method !== 'GET') return

  // 排除 Chrome Extension 請求
  if (url.protocol === 'chrome-extension:') return

  // 匯率 API：Network First（優先網路，失敗才用快取）
  if (url.hostname === 'api.exchangerate-api.com') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功：更新快取並返回
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // 失敗：返回快取（如果有）
          return caches.match(request)
        })
    )
    return
  }

  // 靜態資源：Stale-While-Revalidate（先返回快取，背景更新）
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // 背景更新快取
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return networkResponse
      }).catch((error) => {
        console.error('[SW] Fetch failed:', error)
        // 如果有快取，返回快取；否則返回錯誤
        return cachedResponse || new Response('離線模式：無法載入此資源', {
          status: 503,
          statusText: 'Service Unavailable'
        })
      })

      // 如果有快取，立即返回快取（同時在背景更新）
      return cachedResponse || fetchPromise
    })
  )
})

// Message：接收來自頁面的訊息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
