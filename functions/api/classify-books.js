// Cloudflare Pages Function: /api/classify-books
// POST { titles: ["書名1", "書名2"] }
// 用 Google Books API 查分類，回傳中文分類名稱

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': 'https://tools.helloruru.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Google Books 英文分類 → 中文
const CATEGORY_MAP = {
  'fiction': '文學小說',
  'literary fiction': '文學小說',
  'literary collections': '文學小說',
  'literary criticism': '文學小說',
  'poetry': '文學小說',
  'drama': '文學小說',
  'humor': '文學小說',
  'science fiction': '科幻',
  'fantasy': '奇幻',
  'romance': '愛情',
  'mystery & detective': '推理',
  'mystery': '推理',
  'detective': '推理',
  'thrillers': '推理',
  'thriller': '推理',
  'suspense': '推理',
  'true crime': '推理',
  'historical fiction': '歷史小說',
  'war & military': '歷史小說',
  'business & economics': '商業',
  'business': '商業',
  'economics': '商業',
  'self-help': '自我成長',
  'personal growth': '自我成長',
  'psychology': '心理',
  'philosophy': '哲學',
  'history': '歷史',
  'science': '科學',
  'mathematics': '科學',
  'nature': '科學',
  'medical': '科學',
  'computers': '科學',
  'technology & engineering': '科學',
  'technology': '科學',
  'social science': '社會',
  'sociology': '社會',
  'political science': '社會',
  'law': '社會',
  'biography & autobiography': '傳記',
  'biography': '傳記',
  'comics & graphic novels': '漫畫',
  'art': '藝術',
  'design': '藝術',
  'architecture': '藝術',
  'music': '藝術',
  'photography': '藝術',
  'education': '教育',
  'study aids': '教育',
  'language arts & disciplines': '語言',
  'foreign language study': '語言',
  'juvenile fiction': '兒少',
  'juvenile nonfiction': '兒少',
  'young adult fiction': '兒少',
  'body, mind & spirit': '身心靈',
  'religion': '身心靈',
  'cooking': '生活',
  'health & fitness': '生活',
  'travel': '生活',
  'family & relationships': '生活',
  'sports & recreation': '生活',
  'crafts & hobbies': '生活',
  'gardening': '生活',
  'house & home': '生活',
  'pets': '生活',
  'games': '生活',
  'reference': '工具書',
};

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (context.request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { titles } = await context.request.json();
    if (!Array.isArray(titles) || titles.length === 0) {
      return json({ error: '缺少書名' }, 400);
    }
    if (titles.length > 30) {
      return json({ error: '一次最多 30 本' }, 400);
    }

    const results = {};
    const BATCH = 5;

    for (let i = 0; i < titles.length; i += BATCH) {
      const batch = titles.slice(i, i + BATCH);
      const promises = batch.map(title => classifyOne(title));
      const batchResults = await Promise.all(promises);
      batch.forEach((title, j) => {
        results[title] = batchResults[j];
      });
      // 批次間稍等，避免 Google API 限流
      if (i + BATCH < titles.length) {
        await new Promise(r => setTimeout(r, 150));
      }
    }

    return json({ results });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

async function classifyOne(title) {
  try {
    const q = encodeURIComponent(title);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=3`,
      { headers: { 'User-Agent': 'BookManager/1.0' } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;

    // 試每筆結果，找到有分類的就回傳
    for (const item of data.items) {
      const cat = mapCategory(item.volumeInfo?.categories);
      if (cat) return cat;
    }
    return null;
  } catch {
    return null;
  }
}

function mapCategory(categories) {
  if (!categories || categories.length === 0) return null;

  for (const cat of categories) {
    const lower = cat.toLowerCase();
    // 完全比對
    if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
    // 部分比對
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(key)) return value;
    }
  }
  return '其他';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
