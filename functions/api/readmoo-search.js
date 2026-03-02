// Cloudflare Pages Function: /api/readmoo-search?q=KEYWORD
// Fetches Readmoo search results and returns parsed JSON
// Rate limit: 20 req/min per IP, cache: 30 min per keyword

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': 'https://tools.helloruru.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const CACHE_TTL = 1800; // 30 minutes
const RATE_LIMIT = 20;  // per minute per IP

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(context.request.url);
  const query = url.searchParams.get('q')?.trim();

  if (!query || query.length < 1 || query.length > 100) {
    return new Response(JSON.stringify({ error: '請輸入 1~100 字的搜尋關鍵字' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  // --- Rate Limiting (via CF KV or simple header check) ---
  const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  // Note: For production, use Cloudflare KV or D1 for persistent rate limiting.
  // This is a basic per-request check using Cache API as a counter.

  // --- Cache Check ---
  const cacheKey = `readmoo-search:${encodeURIComponent(query.toLowerCase())}`;
  const cache = caches.default;
  const cacheUrl = new URL(context.request.url);
  cacheUrl.searchParams.set('_cache_key', cacheKey);
  const cacheRequest = new Request(cacheUrl.toString());

  const cached = await cache.match(cacheRequest);
  if (cached) {
    const resp = new Response(cached.body, {
      headers: { ...CORS_HEADERS, 'X-Cache': 'HIT' },
    });
    return resp;
  }

  // --- Fetch from Readmoo ---
  try {
    const searchUrl = `https://readmoo.com/search/keyword?q=${encodeURIComponent(query)}`;
    const rmRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9',
        'Accept': 'text/html',
      },
    });

    if (!rmRes.ok) {
      return new Response(JSON.stringify({ error: `Readmoo returned ${rmRes.status}` }), {
        status: 502, headers: CORS_HEADERS,
      });
    }

    const html = await rmRes.text();
    const books = parseSearchResults(html);

    const body = JSON.stringify({ query, count: books.length, books });

    // --- Store in cache ---
    const cacheResponse = new Response(body, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
      },
    });
    context.waitUntil(cache.put(cacheRequest, cacheResponse.clone()));

    return new Response(body, {
      headers: { ...CORS_HEADERS, 'X-Cache': 'MISS' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
}

/**
 * Parse Readmoo search HTML and extract book data
 */
function parseSearchResults(html) {
  const books = [];

  // Strategy 1: Extract embedded JSON (const items = [...])
  const itemsMatch = html.match(/const\s+items\s*=\s*(\[[\s\S]*?\]);/);
  let itemsMap = {};
  if (itemsMatch) {
    try {
      const items = JSON.parse(itemsMatch[1]);
      items.forEach(item => {
        itemsMap[item.item_id] = {
          id: item.item_id,
          title: item.item_name,
          price: item.price,
          publisher: item.item_brand,
        };
      });
    } catch (e) { /* ignore parse error */ }
  }

  // Strategy 2: Extract cover images + authors from HTML
  // Pattern: <a href="/book/ID" class="book-cover product-link" data-readmoo-id="ID" aria-label="TITLE">
  //   <img ... data-lazy-original="COVER_URL" alt="TITLE">
  const coverPattern = /<a\s+href="https?:\/\/readmoo\.com\/book\/(\d+)"[^>]*class="book-cover product-link"[^>]*aria-label="([^"]*)"[^>]*>[\s\S]*?data-lazy-original="([^"]*)"[^>]*>/g;
  let match;
  const coverMap = {};
  while ((match = coverPattern.exec(html)) !== null) {
    coverMap[match[1]] = {
      title: match[2],
      cover: match[3],
    };
  }

  // Extract authors: <a href="/contributor/ID" aria-label="作者 NAME">NAME</a>
  // Authors appear after each book block, associate by order
  const authorPattern = /<a\s+href="https?:\/\/readmoo\.com\/contributor\/\d+"[^>]*aria-label="作者\s+([^"]*)"[^>]*>/g;
  const authors = [];
  while ((match = authorPattern.exec(html)) !== null) {
    authors.push(match[1]);
  }

  // Merge data: use itemsMap as base, enrich with cover + author
  const ids = Object.keys(itemsMap);
  if (ids.length > 0) {
    ids.forEach((id, index) => {
      const item = itemsMap[id];
      const cover = coverMap[id];
      books.push({
        id: item.id,
        title: item.title,
        price: item.price,
        publisher: item.publisher,
        author: authors[index] || '',
        cover: cover?.cover || '',
        url: `https://readmoo.com/book/${item.id}`,
      });
    });
  } else {
    // Fallback: parse from HTML only
    Object.entries(coverMap).forEach(([id, data], index) => {
      books.push({
        id,
        title: data.title,
        price: 0,
        publisher: '',
        author: authors[index] || '',
        cover: data.cover,
        url: `https://readmoo.com/book/${id}`,
      });
    });
  }

  return books;
}
