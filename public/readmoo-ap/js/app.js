/**
 * 讀墨 AP 接龍工具 — 主程式
 * Tab 路由 + 深色模式 + 全域初始化
 */

// ============ Config ============
const CONFIG = {
  // Google Sheets ID
  SHEET_ID: '1xjGSZquaGyLPRWsBEKtM2_1t_CRS1LLKSF76NhYzaeA',
  // Google Apps Script Web App URL
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwdRGfRb8YvPdOzewdvPZgchW8JHd6sQVL6AJ-AIjxgw41PDL4VZfZtGWYeh69cqObX/exec',
  // localStorage keys
  STORAGE_KEYS: {
    BOOKS: 'readmoo-ap-books',
    USER: 'readmoo-ap-user',
    CHANGELOG: 'readmoo-ap-changelog',
    AP_CACHE: 'readmoo-ap-cache',
    THEME: 'helloruru-theme',
    CHAIN_STATE: 'readmoo-ap-chain-state'
  }
};

// ============ Global State ============
const AppState = {
  members: [],
  user: null,
  isVerified: false
};

// ============ Tab Router ============
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  function switchTab(tabId) {
    tabs.forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
      t.setAttribute('aria-selected', t.dataset.tab === tabId);
    });
    panels.forEach(p => {
      p.classList.toggle('active', p.id === `tab-${tabId}`);
    });
    window.location.hash = tabId;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Hash routing
  const hash = window.location.hash.slice(1);
  if (hash && document.getElementById(`tab-${hash}`)) {
    switchTab(hash);
  }

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.slice(1);
    if (h && document.getElementById(`tab-${h}`)) {
      switchTab(h);
    }
  });
}

// ============ Dark Mode ============
function initDarkMode() {
  const STORAGE_KEY = CONFIG.STORAGE_KEYS.THEME;
  const toggle = document.querySelector('.theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') applyTheme(true);
    else if (saved === 'light') applyTheme(false);
    else applyTheme(prefersDark.matches);
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const next = !isDark;
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }

  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) applyTheme(e.matches);
  });

  if (toggle) toggle.addEventListener('click', toggleTheme);
  initTheme();
}

// ============ Toast ============
function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}

// ============ Modal Helpers ============
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function initModalCloses() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').style.display = 'none';
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });
}

// ============ User Session ============
function loadUser() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  if (saved) {
    AppState.user = JSON.parse(saved);
    AppState.isVerified = true;
  }
}

function saveUser(name, date) {
  AppState.user = { name, date };
  AppState.isVerified = true;
  localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(AppState.user));
}

function requireAuth(callback) {
  if (AppState.isVerified) {
    callback();
  } else {
    openModal('quiz-modal');
    AppState._authCallback = callback;
  }
}

// ============ Google Sheets Reader ============
async function fetchMembersFromSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&headers=0`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    // gviz returns JSONP-like: google.visualization.Query.setResponse({...})
    const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.+)\)/);
    if (!jsonStr) throw new Error('Parse error');
    const json = JSON.parse(jsonStr[1]);

    const rows = json.table.rows;
    const members = [];
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].c;
      const id = cells[0]?.v;
      const name = cells[1]?.v;
      const link = cells[2]?.v;
      if (id && name) {
        members.push({
          id: String(id),
          name: String(name),
          link: link ? String(link) : ''
        });
      }
    }

    AppState.members = members;
    // Cache
    localStorage.setItem(CONFIG.STORAGE_KEYS.AP_CACHE, JSON.stringify({
      data: members,
      time: Date.now()
    }));
    return members;
  } catch (err) {
    console.error('Failed to fetch from Google Sheets:', err);
    // Try cache
    const cached = localStorage.getItem(CONFIG.STORAGE_KEYS.AP_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      AppState.members = parsed.data;
      return parsed.data;
    }
    return [];
  }
}

// ============ Apps Script Writer ============
async function writeToSheet(action, data) {
  if (!CONFIG.APPS_SCRIPT_URL) {
    showToast('Apps Script 尚未設定，請聯繫管理員');
    return { success: false };
  }
  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action,
        editor: AppState.user?.name || '匿名',
        ...data
      })
    });
    const result = await res.json();
    if (result.success) {
      // Refresh data
      await fetchMembersFromSheet();
    }
    return result;
  } catch (err) {
    console.error('Write failed:', err);
    showToast('寫入失敗，請稍後再試');
    return { success: false };
  }
}

// ============ Footer Year ============
function initFooter() {
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const el = document.getElementById('footer-year');
  if (el) {
    el.textContent = currentYear > startYear
      ? `${startYear}\u2013${currentYear}`
      : `${startYear}`;
  }
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  initTabs();
  initModalCloses();
  initFooter();
  loadUser();

  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();

  // Fetch AP members
  const members = await fetchMembersFromSheet();

  // Initialize all modules
  if (window.initQuiz) initQuiz();
  if (window.initDirectory) initDirectory(members);
  if (window.initChain) initChain();
  if (window.initBooks) initBooks();
  if (window.initChangelog) initChangelog();
});
