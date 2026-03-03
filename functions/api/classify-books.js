// Cloudflare Pages Function: /api/classify-books
// POST { titles: ["書名1", "書名2"] }
// 用讀墨書頁 breadcrumb 查分類，回傳中文分類名稱

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': 'https://tools.helloruru.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
  'Accept': 'text/html',
};

// 讀墨分類 → 我們的 25 分類（子分類優先比對，主分類兜底）
const CATEGORY_MAP = {
  // ── 子分類（精確）──
  '心理學': '心理',
  '心理勵志': '心理',
  '哲學': '哲學',
  '推理': '推理',
  '驚悚': '推理',
  '懸疑': '推理',
  '科幻': '科幻',
  '奇幻': '奇幻',
  '羅曼史': '愛情',
  '愛情': '愛情',
  '輕小說': '輕小說',
  '漫畫': '漫畫',
  '傳記': '傳記',
  '自傳': '傳記',
  '回憶錄': '傳記',
  '投資理財': '商業',
  '行銷企管': '商業',
  '經濟趨勢': '商業',
  '職場工作術': '自我成長',
  '個人成長': '自我成長',
  '成功法': '自我成長',
  '人際關係': '自我成長',
  '歷史': '歷史',
  '地理': '歷史',
  '物理': '科學',
  '化學': '科學',
  '生物': '科學',
  '數學': '科學',
  '醫學': '科學',
  '天文': '科學',
  '社會議題': '社會',
  '政治': '社會',
  '法律': '社會',
  '設計': '藝術',
  '攝影': '藝術',
  '音樂': '藝術',
  '繪畫': '藝術',
  '電影': '藝術',
  '建築': '藝術',
  '教養': '教育',
  '育兒': '教育',
  '學習': '教育',
  '外語學習': '語言',
  '英語': '語言',
  '日語': '語言',
  '兒童文學': '兒少',
  '繪本': '兒少',
  '青少年': '兒少',
  '宗教': '身心靈',
  '命理': '身心靈',
  '靈修': '身心靈',
  '飲食': '生活',
  '料理': '生活',
  '旅遊': '生活',
  '健康': '生活',
  '居家': '生活',
  '運動': '生活',
  '考試': '工具書',

  // ── 主分類（兜底）──
  '文學小說': '文學小說',
  '商業理財': '商業',
  '自然科普': '科學',
  '人文社科': '社會',
  '生活風格': '生活',
  '親子教養': '教育',
  '藝術設計': '藝術',
  '語言學習': '語言',
  '宗教命理': '身心靈',
  '電腦資訊': '科學',
  '童書': '兒少',
  '考試用書': '工具書',
  '雜誌': '其他',
  '有聲書': '其他',
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
    if (titles.length > 10) {
      return json({ error: '一次最多 10 本' }, 400);
    }

    const results = {};

    // 3 本一組並行，避免太多同時連線
    const BATCH = 3;
    for (let i = 0; i < titles.length; i += BATCH) {
      const batch = titles.slice(i, i + BATCH);
      const promises = batch.map(title => classifyFromReadmoo(title));
      const batchResults = await Promise.all(promises);
      batch.forEach((title, j) => {
        results[title] = batchResults[j];
      });
      if (i + BATCH < titles.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return json({ results });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// 搜尋讀墨 → 取第一筆的 book ID → 抓書頁 breadcrumb
async function classifyFromReadmoo(title) {
  try {
    // Step 1: 搜尋讀墨
    const cleanTitle = title
      .replace(/[（(]\d+[）)]/g, '')
      .replace(/[（(][小說漫畫輕]*[）)]/g, '')
      .trim() || title;

    const searchUrl = `https://readmoo.com/search/keyword?q=${encodeURIComponent(cleanTitle)}`;
    const searchRes = await fetch(searchUrl, { headers: FETCH_HEADERS });
    if (!searchRes.ok) return null;

    const searchHtml = await searchRes.text();

    // 從嵌入 JSON 取第一筆 book ID
    const itemsMatch = searchHtml.match(/const\s+items\s*=\s*(\[[\s\S]*?\]);/);
    if (!itemsMatch) return null;

    let items;
    try { items = JSON.parse(itemsMatch[1]); } catch { return null; }
    if (!items || items.length === 0) return null;

    const bookId = items[0].item_id;
    if (!bookId) return null;

    // Step 2: 抓書頁 breadcrumb
    const bookUrl = `https://readmoo.com/book/${bookId}`;
    const bookRes = await fetch(bookUrl, { headers: FETCH_HEADERS });
    if (!bookRes.ok) return null;

    const bookHtml = await bookRes.text();

    // 解析 breadcrumb：itemprop="name" 的值
    const names = [];
    const nameRe = /itemprop="name">(.*?)<\/span>/g;
    let m;
    while ((m = nameRe.exec(bookHtml)) !== null) {
      names.push(m[1].trim());
    }

    // names[0] = "分類導覽", names[1] = 主分類, names[2] = 子分類, names[3] = 書名
    // 優先用子分類（更精準），再用主分類
    if (names.length >= 3) {
      const sub = mapCategory(names[2]);
      if (sub) return sub;
    }
    if (names.length >= 2) {
      const main = mapCategory(names[1]);
      if (main) return main;
    }

    return null;
  } catch {
    return null;
  }
}

function mapCategory(readmooCat) {
  if (!readmooCat) return null;
  // 完全比對
  if (CATEGORY_MAP[readmooCat]) return CATEGORY_MAP[readmooCat];
  // 部分比對
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (readmooCat.includes(key)) return value;
  }
  return null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
