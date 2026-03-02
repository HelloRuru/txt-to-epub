// ─── Book Manager — App Core ───

const STORAGE_KEY = 'bookManager_books';
const PLATFORMS = {
  readmoo: { name: '讀墨', color: '#00C1FF' },
  kobo:    { name: 'Kobo', color: '#BF0000' },
  calibre: { name: '本機', color: '#06A865' }
};

// ── State ──────────────────────────────────────────

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

// ── Tab Router ────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  function switchTab(tabId) {
    tabs.forEach(t => {
      const isActive = t.dataset.tab === tabId;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive);
    });
    panels.forEach(p => {
      p.style.display = p.id === `panel-${tabId}` ? '' : 'none';
    });
  }

  tabs.forEach(t => {
    t.addEventListener('click', () => {
      const id = t.dataset.tab;
      switchTab(id);
      history.replaceState(null, '', `#${id}`);
    });
  });

  // Init from hash
  const hash = location.hash.replace('#', '').split('?')[0];
  if (hash && document.getElementById(`panel-${hash}`)) {
    switchTab(hash);
  }
}

// ── Dark Mode ─────────────────────────────────────

function initDarkMode() {
  const btn = document.getElementById('btn-dark-mode');
  const saved = localStorage.getItem('darkMode');

  if (saved === 'true' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    // Update icon
    const icon = btn.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      lucide.createIcons();
    }
  });
}

// ── Toast ─────────────────────────────────────────

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Normalize for dedup ───────────────────────────

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\s+/g, '')           // remove whitespace
    .replace(/[（(].+?[）)]/g, '') // remove subtitle in parens
    .replace(/[【\[].+?[】\]]/g, '') // remove brackets
    .replace(/[:：\-—─·・,，.。、!！?？~～「」『』""''《》〈〉]/g, '') // remove punctuation
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)) // fullwidth → halfwidth
    .trim();
}

// ── Find Duplicates ───────────────────────────────

function findDuplicates(books) {
  const groups = {};

  for (const book of books) {
    const key = normalizeTitle(book.title);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(book);
  }

  // Only groups with 2+ books
  const dupes = {};
  for (const [key, group] of Object.entries(groups)) {
    if (group.length >= 2) {
      dupes[key] = group;
    }
  }
  return dupes;
}

// ── Auto-import from extension URL hash ───────────

function checkAutoImport() {
  const hash = location.hash;
  if (hash.startsWith('#import=')) {
    try {
      const encoded = hash.replace('#import=', '');
      const data = JSON.parse(decodeURIComponent(encoded));
      if (data.books && Array.isArray(data.books)) {
        // Show preview instead of auto-import
        window._pendingImport = data.books;
        showImportPreview(data.books);
        history.replaceState(null, '', location.pathname);
      }
    } catch (e) {
      console.error('Auto-import failed:', e);
    }
  }
}

// ── Init ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  AppState.load();
  initTabs();
  initDarkMode();
  initImport();
  initLibrary();
  initStats();
  lucide.createIcons();
  checkAutoImport();
});
