// eBook Proxy — Cloudflare Worker
// 代替使用者登入讀墨 / Kobo，撈取書櫃

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/fetch/readmoo' && request.method === 'POST') {
        const { email, password } = await request.json();
        if (!email || !password) return jsonError('缺少帳號或密碼', 400);
        const books = await fetchReadmoo(email, password);
        return jsonOk({ books });
      }

      if (path === '/fetch/kobo' && request.method === 'POST') {
        const { email, password } = await request.json();
        if (!email || !password) return jsonError('缺少帳號或密碼', 400);
        const books = await fetchKobo(email, password);
        return jsonOk({ books });
      }

      if (path === '/health') {
        return jsonOk({ status: 'ok' });
      }

      return jsonError('Not found', 404);
    } catch (err) {
      return jsonError(err.message || '伺服器錯誤', 500);
    }
  }
};

// ══════════════════════════════════════════════════
// Readmoo
// ══════════════════════════════════════════════════

async function fetchReadmoo(email, password) {
  // Step 1: 登入取得 token
  // 讀墨用 OAuth2 password grant
  const tokenRes = await fetch('https://member.readmoo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: email,
      password: password,
    })
  });

  if (!tokenRes.ok) {
    const status = tokenRes.status;
    if (status === 401 || status === 400) throw new Error('讀墨帳號或密碼錯誤');
    throw new Error(`讀墨登入失敗 (${status})`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) throw new Error('讀墨登入失敗：無法取得 token');

  // Step 2: 分頁撈書櫃
  const books = [];
  let offset = 0;
  const PAGE_SIZE = 100;

  while (true) {
    const apiUrl = `https://api.readmoo.com/store/v3/me/library_items?page[count]=${PAGE_SIZE}&page[offset]=${offset}`;
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.api+json',
      }
    });

    if (!res.ok) {
      if (books.length > 0) break; // 已撈到一些，容許後續頁失敗
      throw new Error(`讀墨 API 錯誤 (${res.status})`);
    }

    const json = await res.json();

    if (json.included) {
      for (const item of json.included) {
        if (item.type === 'books') {
          const attrs = item.attributes || {};
          books.push({
            title: attrs.title || '',
            author: attrs.author_list || attrs.author || '',
          });
        }
      }
    }

    if (!json.data || json.data.length === 0) break;
    if (json.data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return books;
}

// ══════════════════════════════════════════════════
// Kobo
// ══════════════════════════════════════════════════

async function fetchKobo(email, password) {
  // Kobo 的認證比較複雜：
  // 1. 先到 authorize.kobo.com 取得登入 session
  // 2. 再用 session 取得 API token
  // 3. 用 token 呼叫 library API

  // 方法：用 Kobo 的 web login flow 模擬
  // Step 1: 取得登入頁面和 CSRF token
  const signInUrl = 'https://authorize.kobo.com/signin';
  const pageRes = await fetch(signInUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    redirect: 'manual'
  });

  // 從 Set-Cookie 拿 session cookies
  const cookies = extractCookies(pageRes);
  const pageHtml = await pageRes.text();

  // 找 __RequestVerificationToken
  const tokenMatch = pageHtml.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/);
  const verificationToken = tokenMatch ? tokenMatch[1] : '';

  // Step 2: POST 登入
  const loginRes = await fetch(signInUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
      'User-Agent': 'Mozilla/5.0',
    },
    body: new URLSearchParams({
      'LogInModel.UserName': email,
      'LogInModel.Password': password,
      '__RequestVerificationToken': verificationToken,
    }),
    redirect: 'manual'
  });

  if (loginRes.status !== 302 && loginRes.status !== 200) {
    throw new Error('Kobo 帳號或密碼錯誤');
  }

  const loginCookies = mergeCookies(cookies, extractCookies(loginRes));

  // Step 3: 跟隨重導向拿到最終 auth cookies
  const redirectUrl = loginRes.headers.get('Location');
  let authCookies = loginCookies;

  if (redirectUrl) {
    const rRes = await fetch(redirectUrl.startsWith('http') ? redirectUrl : `https://authorize.kobo.com${redirectUrl}`, {
      headers: { 'Cookie': loginCookies, 'User-Agent': 'Mozilla/5.0' },
      redirect: 'manual'
    });
    authCookies = mergeCookies(loginCookies, extractCookies(rRes));
  }

  // Step 4: 呼叫 Kobo library API
  // Kobo store API 需要特殊 header
  const libraryRes = await fetch('https://storeapi.kobo.com/v1/library/sync', {
    headers: {
      'Cookie': authCookies,
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    }
  });

  if (!libraryRes.ok) {
    // 備用：嘗試用 web 書櫃頁面
    return await fetchKoboFromWeb(authCookies);
  }

  const data = await libraryRes.json();
  return parseKoboLibrary(data);
}

function parseKoboLibrary(data) {
  const books = [];
  // Kobo sync API 回傳 array of items
  const items = Array.isArray(data) ? data : (data.items || data.Books || []);

  for (const item of items) {
    const title = item.Title || item.BookTitle || item.title || '';
    if (!title) continue;
    const author = item.Author || item.ContributorRoles?.[0]?.Name || item.author || '';
    books.push({ title, author });
  }

  return books;
}

async function fetchKoboFromWeb(cookies) {
  // 備用：從 Kobo 書櫃網頁抓
  const res = await fetch('https://www.kobo.com/zh-tw/library', {
    headers: {
      'Cookie': cookies,
      'User-Agent': 'Mozilla/5.0',
    }
  });

  if (!res.ok) throw new Error('Kobo 書櫃存取失敗，請確認帳號密碼');

  const html = await res.text();

  // 嘗試從 HTML 中的 JSON data 抓書
  const books = [];

  // 找 window.__NEXT_DATA__ 或類似的 JSON
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const found = findBooksInObj(nextData);
      if (found.length > 0) return found;
    } catch {}
  }

  // 找所有 JSON script blocks
  const jsonBlocks = html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g);
  for (const match of jsonBlocks) {
    try {
      const data = JSON.parse(match[1]);
      const found = findBooksInObj(data);
      if (found.length > 0) return found;
    } catch {}
  }

  if (books.length === 0) {
    throw new Error('Kobo 書櫃抓取失敗。若帳密正確，可能是 Kobo 網站改版。');
  }

  return books;
}

function findBooksInObj(obj, depth = 0) {
  if (depth > 6 || !obj) return [];
  const results = [];

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === 'object' && (item.Title || item.BookTitle || item.title)) {
        results.push({
          title: item.Title || item.BookTitle || item.title || '',
          author: item.Author || item.ContributorRoles?.[0]?.Name || item.author || '',
        });
      } else {
        results.push(...findBooksInObj(item, depth + 1));
      }
    }
  } else if (typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      results.push(...findBooksInObj(val, depth + 1));
    }
  }

  return results;
}

// ══════════════════════════════════════════════════
// Cookie helpers
// ══════════════════════════════════════════════════

function extractCookies(response) {
  const setCookies = response.headers.getAll?.('Set-Cookie') || [];
  // Cloudflare Workers: headers.getAll may not exist
  if (setCookies.length === 0) {
    const raw = response.headers.get('Set-Cookie') || '';
    if (!raw) return '';
    return raw.split(/,(?=[^ ]+=)/).map(c => c.split(';')[0].trim()).join('; ');
  }
  return setCookies.map(c => c.split(';')[0].trim()).join('; ');
}

function mergeCookies(existing, newCookies) {
  if (!newCookies) return existing;
  const map = {};
  for (const pair of (existing || '').split('; ')) {
    const [k, ...v] = pair.split('=');
    if (k) map[k.trim()] = v.join('=');
  }
  for (const pair of newCookies.split('; ')) {
    const [k, ...v] = pair.split('=');
    if (k) map[k.trim()] = v.join('=');
  }
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

// ══════════════════════════════════════════════════
// Response helpers
// ══════════════════════════════════════════════════

function jsonOk(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

function jsonError(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}
