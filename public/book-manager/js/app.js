// ─── Book Manager — Unified App ───
// Bookmarklet 掃 DOM → 去重 → 匯出

const STORAGE_KEY = 'bookManager_books';
const PLATFORMS = {
  readmoo: { name: '讀墨', color: '#00C1FF' },
  kobo:    { name: 'Kobo', color: '#BF0000' },
  calibre: { name: '本機', color: '#06A865' }
};

// ══════════════════════════════════════════════════
// Readmoo Bookmarklet Code
// ══════════════════════════════════════════════════

function getReadmooBookmarklet() {
  // Bookmarklet v4：直接掃書櫃頁面 DOM（div.title），不碰 token
  // 自動捲動載入全部書籍 → base64 帶回 book-manager
  const code = `void(function(){try{`
    + `if(!location.hostname.includes('readmoo')){alert('請先到 read.readmoo.com 書櫃頁面');return}`
    + `var c=document.querySelector('.mo-bookcase')||document.scrollingElement||document.body,`
    + `last=0,tries=0;`
    // ── 捲動載入所有書 ──
    + `function go(){`
    + `var els=document.querySelectorAll('div.title');`
    + `if(els.length===last){tries++;if(tries>=3){done(els);return}}`
    + `else{tries=0;last=els.length}`
    + `c.scrollTop=c.scrollHeight;window.scrollTo(0,document.body.scrollHeight);`
    + `setTimeout(go,600)}`
    // ── 收集並跳轉 ──
    + `function done(els){`
    + `var b=[],s=new Set();`
    + `els.forEach(function(e){var n=e.textContent.trim();if(n&&!s.has(n)){s.add(n);b.push([n])}});`
    + `if(!b.length){alert('找不到書籍，請確認已開啟書櫃');return}`
    + `if(confirm('找到 '+b.length+' 本書，匯入到書櫃管理工具？')){`
    + `location.href='https://tools.helloruru.com/book-manager/#readmoo='`
    + `+btoa(unescape(encodeURIComponent(JSON.stringify(b))))}}`
    + `go()`
    + `}catch(e){alert('錯誤：'+e.message)}}())`;
  return 'javascript:' + code;
}

// ══════════════════════════════════════════════════
// State
// ══════════════════════════════════════════════════

const AppState = {
  books: [],

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.books = raw ? JSON.parse(raw) : [];
    } catch { this.books = []; }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.books));
  },

  addBooks(newBooks) {
    for (const book of newBooks) {
      book.id = book.id || crypto.randomUUID();
      book.addedAt = book.addedAt || new Date().toISOString();
      this.books.push(book);
    }
    this.save();
    this.notify();
  },

  removeBook(id) {
    this.books = this.books.filter(b => b.id !== id);
    this.save();
    this.notify();
  },

  clearAll() {
    this.books = [];
    this.save();
    this.notify();
  },

  _listeners: [],
  on(fn) { this._listeners.push(fn); },
  notify() { this._listeners.forEach(fn => fn()); }
};

// ══════════════════════════════════════════════════
// Dark Mode
// ══════════════════════════════════════════════════

function initDarkMode() {
  const btn = document.getElementById('btn-dark-mode');
  const saved = localStorage.getItem('helloruru-theme');

  const applyDark = (isDark) => {
    document.documentElement.classList.toggle('dark', isDark);
    const icon = btn?.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      lucide.createIcons();
    }
  };

  if (saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)) {
    applyDark(true);
  }

  btn?.addEventListener('click', () => {
    const isDark = !document.documentElement.classList.contains('dark');
    localStorage.setItem('helloruru-theme', isDark ? 'dark' : 'light');
    applyDark(isDark);
  });
}

// ══════════════════════════════════════════════════
// Toast
// ══════════════════════════════════════════════════

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = '';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = 'none'; }, 3000);
}


// ══════════════════════════════════════════════════
// Manual Paste (本機藏書)
// ══════════════════════════════════════════════════

function handleManualAdd() {
  const textarea = document.getElementById('manual-paste');
  const text = textarea.value.trim();
  if (!text) { showToast('請先輸入書名'); return; }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const books = lines.map(line => {
    const parts = line.split(/[,，\t|]/).map(s => s.trim());
    return {
      title: parts[0] || '',
      author: parts[1] || '',
      platform: 'calibre'
    };
  }).filter(b => b.title);

  if (books.length === 0) { showToast('沒有偵測到書名'); return; }

  AppState.addBooks(books);
  textarea.value = '';
  showToast(`已加入 ${books.length} 本`);
  showLibrary();
}

// ══════════════════════════════════════════════════
// Normalize + Dedup
// ══════════════════════════════════════════════════

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[（(].+?[）)]/g, '')
    .replace(/[【\[].+?[】\]]/g, '')
    .replace(/[:：\-—─·・,，.。、!！?？~～「」『』""''《》〈〉]/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .trim();
}

function findDuplicates(books) {
  const groups = {};
  for (const book of books) {
    const key = normalizeTitle(book.title);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(book);
  }
  const dupes = {};
  for (const [key, group] of Object.entries(groups)) {
    if (group.length >= 2) dupes[key] = group;
  }
  return dupes;
}

// ══════════════════════════════════════════════════
// Library Rendering
// ══════════════════════════════════════════════════

let currentFilter = 'all';
let searchQuery = '';
let sortBy = 'title'; // 'title' | 'platform'

function showLibrary() {
  const section = document.getElementById('section-library');
  if (AppState.books.length > 0) {
    section.style.display = '';
  }
  renderLibrary();
}

function sortBooks(books) {
  return [...books].sort((a, b) => {
    if (sortBy === 'platform') {
      const pa = PLATFORMS[a.platform]?.name || a.platform;
      const pb = PLATFORMS[b.platform]?.name || b.platform;
      if (pa !== pb) return pa.localeCompare(pb, 'zh-TW');
    }
    return (a.title || '').localeCompare(b.title || '', 'zh-TW');
  });
}

function renderLibrary() {
  const bookList = document.getElementById('book-list');
  const dupGroupsEl = document.getElementById('dup-groups');
  const emptyState = document.getElementById('empty-state');
  const badge = document.getElementById('total-badge');
  const dupBanner = document.getElementById('dup-banner');
  const dupBannerText = document.getElementById('dup-banner-text');

  badge.textContent = AppState.books.length;

  if (AppState.books.length === 0) {
    bookList.innerHTML = '';
    dupGroupsEl.innerHTML = '';
    emptyState.style.display = '';
    dupBanner.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';

  // Duplicates
  const dupes = findDuplicates(AppState.books);
  const dupeIds = new Set();
  for (const group of Object.values(dupes)) {
    for (const book of group) dupeIds.add(book.id);
  }

  const dupeGroupCount = Object.keys(dupes).length;
  if (dupeGroupCount > 0) {
    dupBanner.style.display = '';
    dupBannerText.textContent = `偵測到 ${dupeGroupCount} 組重複書籍`;
  } else {
    dupBanner.style.display = 'none';
  }

  // Filter
  let filtered = AppState.books;
  if (currentFilter === 'duplicate') {
    filtered = filtered.filter(b => dupeIds.has(b.id));
  } else if (currentFilter !== 'all') {
    filtered = filtered.filter(b => b.platform === currentFilter);
  }

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(b =>
      (b.title || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q)
    );
  }

  // Sort
  filtered = sortBooks(filtered);

  // Render duplicate groups
  dupGroupsEl.innerHTML = '';
  if (currentFilter === 'all' || currentFilter === 'duplicate') {
    for (const [key, group] of Object.entries(dupes)) {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!group.some(b =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q)
        )) continue;
      }

      const platforms = [...new Set(group.map(b => b.platform))];
      const isXPlatform = platforms.length > 1;

      const el = document.createElement('div');
      el.className = 'dup-group';
      el.innerHTML = `<div class="dup-group-title">
        <i data-lucide="${isXPlatform ? 'alert-triangle' : 'copy'}" width="16" height="16"></i>
        ${isXPlatform ? '跨平台重複' : '同平台重複'} — ${group.length} 本
      </div>`;

      for (const book of group) {
        el.appendChild(createBookItem(book));
      }
      dupGroupsEl.appendChild(el);
    }
  }

  // Render non-duplicate books
  bookList.innerHTML = '';
  const nonDupes = currentFilter === 'duplicate'
    ? []
    : filtered.filter(b => !dupeIds.has(b.id));

  for (const book of nonDupes) {
    bookList.appendChild(createBookItem(book));
  }

  if (filtered.length === 0) {
    const p = document.createElement('div');
    p.className = 'empty';
    p.innerHTML = '<p>沒有符合的結果</p>';
    bookList.appendChild(p);
  }

  lucide.createIcons();
}

function createBookItem(book) {
  const el = document.createElement('div');
  el.className = 'book-item';
  el.style.setProperty('--pl-color', PLATFORMS[book.platform]?.color || '#888');

  const badgeColor = PLATFORMS[book.platform]?.color || '#888';
  const badgeName = PLATFORMS[book.platform]?.name || book.platform;

  el.innerHTML = `
    <span class="book-title">${escapeHtml(book.title)}</span>
    ${book.author ? `<span class="book-author">${escapeHtml(book.author)}</span>` : ''}
    <span class="book-badge" style="background:${badgeColor}">${badgeName}</span>
    <button class="book-del" title="刪除">
      <i data-lucide="x" width="14" height="14"></i>
    </button>
  `;

  el.querySelector('.book-del').addEventListener('click', (e) => {
    e.stopPropagation();
    AppState.removeBook(book.id);
    showToast('已刪除');
  });

  return el;
}

// ══════════════════════════════════════════════════
// Export
// ══════════════════════════════════════════════════

function exportCSV() {
  if (AppState.books.length === 0) { showToast('書櫃是空的'); return; }

  const lines = ['書名,作者,平台,重複'];
  const dupes = findDuplicates(AppState.books);
  const dupeIds = new Set();
  for (const group of Object.values(dupes)) {
    for (const book of group) dupeIds.add(book.id);
  }

  for (const b of sortBooks(AppState.books)) {
    const pName = PLATFORMS[b.platform]?.name || b.platform;
    const isDupe = dupeIds.has(b.id) ? '是' : '';
    lines.push(`"${(b.title || '').replace(/"/g, '""')}","${(b.author || '').replace(/"/g, '""')}","${pName}","${isDupe}"`);
  }

  downloadFile(lines.join('\n'), `book-manager_${today()}.csv`, 'text/csv');
  showToast('CSV 已下載，可用 Excel 開啟');
}

function exportPlainText() {
  if (AppState.books.length === 0) { showToast('書櫃是空的'); return; }

  const dupes = findDuplicates(AppState.books);
  const dupeIds = new Set();
  for (const group of Object.values(dupes)) {
    for (const book of group) dupeIds.add(book.id);
  }

  const lines = [];
  lines.push('讀墨書櫃整理 — 書單匯出');
  lines.push(`日期：${today()}`);
  lines.push(`共 ${AppState.books.length} 本`);
  lines.push('');

  // 按平台分組
  for (const [key, info] of Object.entries(PLATFORMS)) {
    const platBooks = sortBooks(AppState.books.filter(b => b.platform === key));
    if (platBooks.length === 0) continue;

    lines.push(`── ${info.name} (${platBooks.length} 本) ──`);
    platBooks.forEach((b, i) => {
      const author = b.author ? ` / ${b.author}` : '';
      const dup = dupeIds.has(b.id) ? ' [重複]' : '';
      lines.push(`${i + 1}. ${b.title}${author}${dup}`);
    });
    lines.push('');
  }

  // 重複摘要
  const dupeEntries = Object.values(dupes);
  if (dupeEntries.length > 0) {
    lines.push(`── 重複書籍 (${dupeEntries.length} 組) ──`);
    for (const group of dupeEntries) {
      const platforms = [...new Set(group.map(b => PLATFORMS[b.platform]?.name || b.platform))].join(', ');
      lines.push(`- ${group[0].title} (${platforms})`);
    }
    lines.push('');
  }

  downloadFile(lines.join('\n'), `book-manager_${today()}.txt`, 'text/plain');
  showToast('純文字已下載');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(content, filename, type) {
  const blob = new Blob(['\uFEFF' + content], { type: type + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}


// ══════════════════════════════════════════════════
// Hash Import (Bookmarklet v4 帶回的書單資料)
// ══════════════════════════════════════════════════

function checkHashImport() {
  const hash = location.hash;
  if (!hash) return;

  // 格式：#readmoo=BASE64_JSON 或 #kobo=BASE64_JSON
  const match = hash.match(/^#(readmoo|kobo)=(.+)$/);
  if (!match) return;

  const platform = match[1];
  const b64 = match[2];

  try {
    const json = decodeURIComponent(escape(atob(b64)));
    const compact = JSON.parse(json);

    if (!Array.isArray(compact) || compact.length === 0) {
      showToast('匯入資料為空');
      return;
    }

    const books = compact.map(item => ({
      title: Array.isArray(item) ? item[0] || '' : item.title || '',
      author: Array.isArray(item) ? item[1] || '' : item.author || '',
      platform
    }));

    // 去除已存在的
    const existingKeys = new Set(
      AppState.books
        .filter(b => b.platform === platform)
        .map(b => normalizeTitle(b.title))
    );
    const newBooks = books.filter(b => !existingKeys.has(normalizeTitle(b.title)));
    const skipCount = books.length - newBooks.length;

    if (newBooks.length > 0) {
      AppState.addBooks(newBooks);
    }

    // 更新 UI
    const statusEl = document.getElementById(`status-${platform}`);
    const resultEl = document.getElementById(`result-${platform}`);
    if (statusEl) {
      statusEl.textContent = '已連接';
      statusEl.className = 'platform-status ok';
    }
    if (resultEl) {
      resultEl.className = 'platform-result';
      resultEl.innerHTML = `<strong>${books.length}</strong> 本書（Bookmarklet 匯入）` +
        (skipCount > 0 ? `<br>${skipCount} 本已存在，新增 ${newBooks.length} 本` : '');
      resultEl.style.display = '';
    }

    showToast(`${PLATFORMS[platform].name}：成功匯入 ${books.length} 本`);
    showLibrary();
  } catch (err) {
    showToast('匯入失敗：資料格式錯誤');
  } finally {
    history.replaceState(null, '', location.pathname);
  }
}

// ══════════════════════════════════════════════════
// Bookmarklet Init
// ══════════════════════════════════════════════════

function initBookmarklets() {
  // 設定讀墨 Bookmarklet 連結
  const bmLink = document.getElementById('bm-link-readmoo');
  if (bmLink) {
    bmLink.href = getReadmooBookmarklet();
    // 在本頁點擊時不執行（要在 readmoo.com 上用才有效）
    bmLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('請把這個按鈕拖到書籤列，在讀墨網站上使用');
    });
  }

  // 複製按鈕
  const copyBtn = document.getElementById('btn-copy-bm');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = getReadmooBookmarklet();
      navigator.clipboard.writeText(code).then(() => {
        showToast('已複製！新增書籤後貼上網址即可');
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('已複製！新增書籤後貼上網址即可');
      });
    });
  }
}

// ══════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  AppState.load();
  initDarkMode();
  initBookmarklets();

  // ── Manual paste ──
  document.getElementById('btn-add-manual').addEventListener('click', handleManualAdd);

  // ── Search ──
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderLibrary();
  });

  // ── Filter pills ──
  document.querySelectorAll('.pill[data-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-filter]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderLibrary();
    });
  });

  // ── Sort toggle ──
  const sortBtn = document.getElementById('btn-sort');
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      sortBy = sortBy === 'title' ? 'platform' : 'title';
      sortBtn.textContent = sortBy === 'title' ? '按書名' : '按平台';
      renderLibrary();
    });
  }

  // ── Export ──
  document.getElementById('btn-export').addEventListener('click', exportCSV);
  document.getElementById('btn-export-txt')?.addEventListener('click', exportPlainText);

  // ── Clear ──
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('確定要清空全部書櫃資料嗎？')) return;
    AppState.clearAll();
    showToast('書櫃已清空');
    document.getElementById('section-library').style.display = 'none';
  });

  // ── State change listener ──
  AppState.on(() => renderLibrary());

  // ── Initial render ──
  lucide.createIcons();
  showLibrary();

  // ── 檢查 Bookmarklet 帶回的資料 ──
  checkHashImport();
});
