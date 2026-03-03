// Cloudflare Pages Function: /api/daily-99
// 抓讀墨「每日特惠書」，回傳今天的 $99 書籍
// 資料來源：readmoo.com/campaign/specialoffer/index

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const SOURCE_URL = 'https://readmoo.com/campaign/specialoffer/index';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const res = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9',
        'Accept': 'text/html',
      },
    });

    if (!res.ok) {
      return jsonResp({ error: `Readmoo ${res.status}` }, 502);
    }

    const html = await res.text();
    const data = parsePromo(html);

    if (!data) {
      return jsonResp({ error: 'parse failed' }, 502);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    return jsonResp({ error: err.message }, 500);
  }
}

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CORS_HEADERS });
}

// 把 JS 物件字面量轉成合法 JSON
// Readmoo 的頂層 key 沒引號（imageBaseUrl: 而非 "imageBaseUrl":），且有 trailing comma
function fixJsObjectToJson(str) {
  // 1. 把沒引號的 key 加上引號（只對 {, 後面的英數底線 key，不動已有引號的）
  str = str.replace(/([{,]\s*)([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":');
  // 2. 移除 } 或 ] 前的 trailing comma
  str = str.replace(/,(\s*[}\]])/g, '$1');
  return str;
}

function parsePromo(html) {
  const marker = 'window.READMOO_DAILY_PROMO = ';
  const start = html.indexOf(marker);
  if (start === -1) return null;

  const jsonStart = start + marker.length;

  // 用括號計數找到匹配的 }
  let depth = 0;
  let end = -1;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end === -1) return null;

  const raw = html.substring(jsonStart, end);
  let promo;
  try {
    promo = JSON.parse(fixJsObjectToJson(raw));
  } catch (e) {
    return null;
  }

  if (!promo.schedules || !Array.isArray(promo.schedules)) return null;

  const books = promo.schedules
    .filter(s => s.state === 'normal' && s.book)
    .map(s => {
      const b = s.book;
      const author = (b.contributors || []).find(c => c.type === 'A01');
      return {
        date: s.date,
        title: b.title,
        author: author ? author.name : '',
        publisher: b.publisher ? b.publisher.name : '',
        cover: b.cover_url || '',
        url: b.store_url || '',
        promoPrice: s.promo_price,
        originalPrice: parseFloat(b.ref_price) || 0,
      };
    });

  // 台灣時區：UTC+8
  const now = new Date();
  const twTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const today = twTime.toISOString().split('T')[0];

  const todayBook = books.find(b => b.date === today);
  const upcoming = books.filter(b => b.date > today).slice(0, 3);

  return { today: todayBook || null, upcoming };
}
