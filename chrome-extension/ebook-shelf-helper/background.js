// eBook Shelf Helper — Background Service Worker
// 兩種撈法：API（主） → Content Script DOM scraping（備）

const READMOO_API = 'https://api.readmoo.com/store/v3/me/library_items';
const PAGE_SIZE = 100;

// ══════════════════════════════════════════════════
// Readmoo
// ══════════════════════════════════════════════════

async function checkReadmooLogin() {
  const cookies = await chrome.cookies.getAll({ domain: '.readmoo.com' });
  return cookies.length > 0;
}

// 策略 1：用 cookie 呼叫 API
async function fetchReadmooViaAPI() {
  const cookies = await chrome.cookies.getAll({ domain: '.readmoo.com' });
  if (cookies.length === 0) throw new Error('NO_LOGIN');

  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  // 嘗試找 Bearer token（readmoo 可能把 access_token 存在 cookie 或 localStorage）
  const tokenCookie = cookies.find(c =>
    c.name === 'access_token' || c.name === 'token' || c.name === 'auth_token'
  );

  const headers = {
    'Accept': 'application/vnd.api+json',
  };

  // 優先用 Bearer token，沒有就用 cookie
  if (tokenCookie) {
    headers['Authorization'] = `Bearer ${tokenCookie.value}`;
  } else {
    headers['Cookie'] = cookieStr;
  }

  const books = [];
  let offset = 0;

  while (true) {
    const url = `${READMOO_API}?page[count]=${PAGE_SIZE}&page[offset]=${offset}`;
    const res = await fetch(url, { headers, credentials: 'include' });

    if (res.status === 401 || res.status === 403) {
      throw new Error('AUTH_FAILED');
    }
    if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

    const json = await res.json();

    if (json.included) {
      for (const item of json.included) {
        if (item.type === 'books') {
          const attrs = item.attributes || {};
          books.push({
            id: item.id,
            title: attrs.title || '',
            author: attrs.author_list || attrs.author || '',
            platform: 'readmoo'
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

// 策略 2：Content Script 注入到 readmoo.com 頁面，從頁面 context 呼叫 API
async function fetchReadmooViaTab() {
  // 找已開的 readmoo tab，或開新 tab
  let tab = await findTab('readmoo.com');
  if (!tab) {
    tab = await chrome.tabs.create({ url: 'https://readmoo.com/me/library', active: false });
    await waitForTab(tab.id);
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: async function () {
      // 這段 code 跑在 readmoo.com 的頁面 context，能用頁面的 cookies/auth
      const API = 'https://api.readmoo.com/store/v3/me/library_items';
      const books = [];
      let offset = 0;
      const PAGE = 100;

      while (true) {
        try {
          const res = await fetch(`${API}?page[count]=${PAGE}&page[offset]=${offset}`, {
            credentials: 'include',
            headers: { 'Accept': 'application/vnd.api+json' }
          });
          if (!res.ok) break;
          const json = await res.json();

          if (json.included) {
            for (const item of json.included) {
              if (item.type === 'books') {
                const a = item.attributes || {};
                books.push({
                  id: item.id,
                  title: a.title || '',
                  author: a.author_list || a.author || '',
                  platform: 'readmoo'
                });
              }
            }
          }
          if (!json.data || json.data.length < PAGE) break;
          offset += PAGE;
        } catch (e) {
          break;
        }
      }
      return books;
    }
  });

  return results[0]?.result || [];
}

// 策略 3：DOM 抓取（最後手段）
async function fetchReadmooViaDOM() {
  let tab = await findTab('readmoo.com');
  if (!tab) {
    tab = await chrome.tabs.create({ url: 'https://readmoo.com/me/library', active: false });
    await waitForTab(tab.id);
  }

  // 等頁面載入
  await new Promise(r => setTimeout(r, 3000));

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function () {
      // 嘗試抓取書櫃頁面 DOM 中的書名
      const books = [];
      // 常見的 readmoo 書名元素 selector（可能需要調整）
      const selectors = [
        '.library-item .title',
        '.book-title',
        '[class*="bookTitle"]',
        '[class*="book-name"]',
        '.item-title',
        'h3.title',
        '.library-list .title'
      ];

      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          els.forEach(el => {
            const title = el.textContent?.trim();
            if (title) books.push({ title, author: '', platform: 'readmoo' });
          });
          break;
        }
      }

      // 如果都找不到，嘗試抓所有看起來像書名的元素
      if (books.length === 0) {
        // 回傳頁面上所有可見文字讓 popup 做進一步解析
        return { fallback: true, html: document.body.innerText.substring(0, 50000) };
      }

      return { fallback: false, books };
    }
  });

  const data = results[0]?.result;
  if (!data) throw new Error('DOM 抓取失敗');
  if (data.fallback) throw new Error('DOM_FALLBACK');
  return data.books || [];
}

// ══════════════════════════════════════════════════
// Kobo
// ══════════════════════════════════════════════════

async function checkKoboLogin() {
  const cookies = await chrome.cookies.getAll({ domain: '.kobo.com' });
  return cookies.length > 0;
}

async function fetchKoboViaTab() {
  let tab = await findTab('kobo.com');
  if (!tab) {
    tab = await chrome.tabs.create({ url: 'https://www.kobo.com/zh-tw/library', active: false });
    await waitForTab(tab.id);
    await new Promise(r => setTimeout(r, 3000));
  }

  // Kobo 書櫃頁面 DOM 抓取
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function () {
      const books = [];
      const selectors = [
        '.book-list-item .title',
        '[class*="BookTitle"]',
        '.library-item .title',
        '.product-field .title',
        '[data-testid*="title"]',
        '.item-detail h2',
        '.book-title',
        'h2.title'
      ];

      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          els.forEach(el => {
            const title = el.textContent?.trim();
            if (title) {
              // 嘗試找同層的 author 元素
              const parent = el.closest('[class*="item"]') || el.parentElement;
              const authorEl = parent?.querySelector('[class*="author"], [class*="Author"], .subtitle');
              books.push({
                title,
                author: authorEl?.textContent?.trim() || '',
                platform: 'kobo'
              });
            }
          });
          break;
        }
      }

      // 嘗試從 page script 中找 library data（很多 SPA 把資料存在 window 變數）
      if (books.length === 0) {
        // 嘗試找 Next.js / React 的 hydration data
        const scripts = document.querySelectorAll('script[type="application/json"]');
        for (const s of scripts) {
          try {
            const data = JSON.parse(s.textContent);
            // 遞迴搜尋含有 Title 屬性的物件
            const found = findBooks(data);
            if (found.length > 0) return { fallback: false, books: found };
          } catch (e) { /* skip */ }
        }

        // 嘗試 window.__NEXT_DATA__ 或類似
        try {
          const nextData = window.__NEXT_DATA__ || window.__NUXT__;
          if (nextData) {
            const found = findBooks(nextData);
            if (found.length > 0) return { fallback: false, books: found };
          }
        } catch (e) { /* skip */ }
      }

      function findBooks(obj, depth = 0) {
        if (depth > 5 || !obj) return [];
        const results = [];
        if (Array.isArray(obj)) {
          for (const item of obj) {
            if (item && typeof item === 'object' && (item.Title || item.BookTitle || item.title)) {
              results.push({
                title: item.Title || item.BookTitle || item.title || '',
                author: item.Author || item.ContributorRoles?.[0]?.Name || item.author || '',
                platform: 'kobo'
              });
            } else {
              results.push(...findBooks(item, depth + 1));
            }
          }
        } else if (typeof obj === 'object') {
          for (const val of Object.values(obj)) {
            results.push(...findBooks(val, depth + 1));
          }
        }
        return results;
      }

      if (books.length === 0) {
        return { fallback: true, url: window.location.href };
      }
      return { fallback: false, books };
    }
  });

  const data = results[0]?.result;
  if (!data || data.fallback) {
    throw new Error('Kobo 書櫃頁面抓取失敗。請確認已登入並在書櫃頁面。');
  }
  return data.books || [];
}

// ══════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════

async function findTab(domain) {
  const tabs = await chrome.tabs.query({});
  return tabs.find(t => t.url && t.url.includes(domain));
}

function waitForTab(tabId) {
  return new Promise((resolve) => {
    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
    // Timeout after 15 seconds
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 15000);
  });
}

// ══════════════════════════════════════════════════
// Message Handler
// ══════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'checkLogin') {
    (async () => {
      const readmoo = await checkReadmooLogin();
      const kobo = await checkKoboLogin();
      sendResponse({ readmoo, kobo });
    })();
    return true;
  }

  if (msg.action === 'fetchReadmoo') {
    (async () => {
      try {
        // 策略 1：直接 API
        const books = await fetchReadmooViaAPI();
        if (books.length > 0) {
          sendResponse({ success: true, books, method: 'api' });
          return;
        }
      } catch (e) {
        console.log('Readmoo API failed:', e.message, '→ trying tab injection');
      }

      try {
        // 策略 2：Tab 注入呼叫 API（頁面 context）
        const books = await fetchReadmooViaTab();
        if (books.length > 0) {
          sendResponse({ success: true, books, method: 'tab' });
          return;
        }
      } catch (e) {
        console.log('Readmoo tab injection failed:', e.message, '→ trying DOM scraping');
      }

      try {
        // 策略 3：DOM 抓取
        const books = await fetchReadmooViaDOM();
        sendResponse({ success: true, books, method: 'dom' });
      } catch (e) {
        sendResponse({
          success: false,
          error: '撈取失敗。請確認已登入 readmoo.com，然後重試。'
        });
      }
    })();
    return true;
  }

  if (msg.action === 'fetchKobo') {
    (async () => {
      try {
        const books = await fetchKoboViaTab();
        sendResponse({ success: true, books });
      } catch (e) {
        sendResponse({
          success: false,
          error: e.message || '撈取失敗。請先開啟 kobo.com/zh-tw/library 登入。'
        });
      }
    })();
    return true;
  }
});
