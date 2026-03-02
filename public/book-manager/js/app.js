// ─── Book Manager — Unified App ───
// 單頁式：登入 → Worker 撈書 → 去重 → 匯出

const WORKER_URL = 'https://ebook-proxy.vmpvmp1017.workers.dev';
const STORAGE_KEY = 'bookManager_books';
const EMAIL_KEY = 'bookManager_emails';
const PLATFORMS = {
  readmoo: { name: '讀墨', color: '#00C1FF' },
  kobo:    { name: 'Kobo', color: '#BF0000' },
  calibre: { name: '本機', color: '#06A865' }
};

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
  const saved = localStorage.getItem('darkMode');

  if (saved === 'true' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    const icon = btn.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      lucide.createIcons();
    }
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
// Remember Email
// ══════════════════════════════════════════════════

function loadEmails() {
  try {
    const raw = localStorage.getItem(EMAIL_KEY);
    const emails = raw ? JSON.parse(raw) : {};
    if (emails.readmoo) document.getElementById('readmoo-email').value = emails.readmoo;
    if (emails.kobo) document.getElementById('kobo-email').value = emails.kobo;
  } catch {}
}

function saveEmail(platform, email) {
  try {
    const raw = localStorage.getItem(EMAIL_KEY);
    const emails = raw ? JSON.parse(raw) : {};
    emails[platform] = email;
    localStorage.setItem(EMAIL_KEY, JSON.stringify(emails));
  } catch {}
}

// ══════════════════════════════════════════════════
// Password Toggle
// ══════════════════════════════════════════════════

function initPasswordToggles() {
  document.querySelectorAll('.btn-pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      const icon = btn.querySelector('[data-lucide]');
      if (icon) {
        icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        lucide.createIcons();
      }
    });
  });
}

// ══════════════════════════════════════════════════
// Platform Fetch (via Worker)
// ══════════════════════════════════════════════════

async function fetchPlatform(platform, email, password) {
  const statusEl = document.getElementById(`status-${platform}`);
  const progressEl = document.getElementById(`progress-${platform}`);
  const fillEl = document.getElementById(`fill-${platform}`);
  const textEl = document.getElementById(`text-${platform}`);
  const resultEl = document.getElementById(`result-${platform}`);
  const btn = document.getElementById(`btn-fetch-${platform}`);

  // Save email
  saveEmail(platform, email);

  // UI: loading state
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 撈取中...';
  progressEl.style.display = '';
  resultEl.style.display = 'none';
  fillEl.style.width = '10%';
  textEl.textContent = '登入中...';
  statusEl.textContent = '';
  statusEl.className = 'platform-status';

  try {
    fillEl.style.width = '30%';
    textEl.textContent = '正在撈取書櫃...';

    const res = await fetch(`${WORKER_URL}/fetch/${platform}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    fillEl.style.width = '80%';

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || '撈取失敗');
    }

    const data = await res.json();
    fillEl.style.width = '100%';
    textEl.textContent = '完成！';

    if (!data.books || data.books.length === 0) {
      throw new Error('書櫃是空的，或帳號密碼錯誤');
    }

    // Success
    const books = data.books.map(b => ({
      title: b.title || '',
      author: b.author || '',
      platform
    }));

    // Check duplicates with existing
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

    resultEl.className = 'platform-result';
    resultEl.innerHTML = `<strong>${books.length}</strong> 本書` +
      (skipCount > 0 ? `（${skipCount} 本已存在，新增 ${newBooks.length} 本）` : '');
    resultEl.style.display = '';

    statusEl.textContent = '已連接';
    statusEl.className = 'platform-status ok';

    showToast(`${PLATFORMS[platform].name}：成功撈取 ${books.length} 本`);
    showLibrary();

  } catch (err) {
    fillEl.style.width = '0%';
    textEl.textContent = '';
    progressEl.style.display = 'none';

    resultEl.className = 'platform-result err';
    resultEl.textContent = err.message;
    resultEl.style.display = '';

    statusEl.textContent = '失敗';
    statusEl.className = 'platform-status err';
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    lucide.createIcons();
  }
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

function triggerFetch(platform) {
  const email = document.getElementById(`${platform}-email`).value.trim();
  const pass = document.getElementById(`${platform}-pass`).value;
  if (!email || !pass) { showToast('請填寫帳號密碼'); return; }
  fetchPlatform(platform, email, pass);
}

// ══════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  AppState.load();
  initDarkMode();
  initPasswordToggles();
  loadEmails();

  // ── Readmoo fetch ──
  document.getElementById('btn-fetch-readmoo').addEventListener('click', () => triggerFetch('readmoo'));

  // ── Kobo fetch ──
  document.getElementById('btn-fetch-kobo').addEventListener('click', () => triggerFetch('kobo'));

  // ── Enter key on password fields ──
  document.getElementById('readmoo-pass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerFetch('readmoo');
  });
  document.getElementById('kobo-pass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerFetch('kobo');
  });

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

  // ── Export CSV ──
  document.getElementById('btn-export').addEventListener('click', exportCSV);

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
});
