// eBook Shelf Helper — Popup Logic

const BOOK_MANAGER_URL = 'https://tools.helloruru.com/book-manager/';
let allBooks = { readmoo: [], kobo: [] };

// ── Init ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Check login status
  chrome.runtime.sendMessage({ action: 'checkLogin' }, (res) => {
    if (!res) return;

    if (res.readmoo) {
      setStatus('readmoo', '已登入', 'logged-in');
      document.getElementById('btn-readmoo').disabled = false;
    } else {
      setStatus('readmoo', '未登入 — 請先開 readmoo.com 登入', 'error');
    }

    if (res.kobo) {
      setStatus('kobo', '已登入', 'logged-in');
      document.getElementById('btn-kobo').disabled = false;
    } else {
      setStatus('kobo', '未登入 — 請先開 kobo.com 登入', 'error');
    }
  });

  // Listen for progress updates
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'progress') {
      updateProgress(msg.platform, msg.current, msg.total);
    }
  });

  // Button handlers
  document.getElementById('btn-readmoo').addEventListener('click', () => fetchPlatform('readmoo'));
  document.getElementById('btn-kobo').addEventListener('click', () => fetchPlatform('kobo'));
  document.getElementById('btn-export').addEventListener('click', exportJSON);
  document.getElementById('btn-open').addEventListener('click', openBookManager);
});

// ── Fetch ─────────────────────────────────────────

async function fetchPlatform(platform) {
  const btn = document.getElementById(`btn-${platform}`);
  const progress = document.getElementById(`progress-${platform}`);

  btn.disabled = true;
  btn.textContent = '撈取中...';
  progress.style.display = 'block';

  const actionMap = { readmoo: 'fetchReadmoo', kobo: 'fetchKobo' };

  chrome.runtime.sendMessage({ action: actionMap[platform] }, (res) => {
    if (!res) {
      showError(platform, '連線失敗，請重試');
      btn.disabled = false;
      btn.textContent = '重新撈取';
      return;
    }

    if (res.success) {
      allBooks[platform] = res.books;
      showResult(platform, res.books.length);
      btn.textContent = `已完成（${res.books.length} 本）`;
      updateTotal();
    } else if (res.needDom) {
      // Kobo needs DOM scraping — open Kobo library page
      showError(platform, 'API 撈取失敗，請開啟 kobo.com/zh-tw/library 後重試');
      btn.disabled = false;
      btn.textContent = '重新撈取';
    } else {
      showError(platform, res.error);
      btn.disabled = false;
      btn.textContent = '重新撈取';
    }
  });
}

// ── UI Helpers ────────────────────────────────────

function setStatus(platform, text, className) {
  const el = document.getElementById(`status-${platform}`);
  el.textContent = text;
  el.className = 'platform-status ' + (className || '');
}

function updateProgress(platform, current, total) {
  const text = document.getElementById(`progress-text-${platform}`);
  const fill = document.getElementById(`progress-fill-${platform}`);
  const pct = total ? Math.round((current / total) * 100) : 0;
  text.textContent = `${current} / ${total || '?'} 本（${pct}%）`;
  fill.style.width = pct + '%';
}

function showResult(platform, count) {
  const el = document.getElementById(`result-${platform}`);
  el.style.display = 'block';
  el.innerHTML = `找到 <strong>${count}</strong> 本書`;
  document.getElementById(`progress-${platform}`).style.display = 'none';
}

function showError(platform, message) {
  const el = document.getElementById(`result-${platform}`);
  el.style.display = 'block';
  el.innerHTML = `<span style="color:#D64045">${message}</span>`;
}

function updateTotal() {
  const total = allBooks.readmoo.length + allBooks.kobo.length;
  if (total > 0) {
    document.getElementById('total-bar').style.display = 'block';
    document.getElementById('total-count').textContent = total;
    document.getElementById('btn-export').disabled = false;
    document.getElementById('btn-open').disabled = false;
  }
}

// ── Export ─────────────────────────────────────────

function exportJSON() {
  const combined = [...allBooks.readmoo, ...allBooks.kobo];
  if (combined.length === 0) return;

  const data = {
    exportDate: new Date().toISOString().slice(0, 10),
    source: 'ebook-shelf-helper',
    platforms: {
      readmoo: allBooks.readmoo.length,
      kobo: allBooks.kobo.length
    },
    books: combined
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ebook-shelf_${data.exportDate}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function openBookManager() {
  const combined = [...allBooks.readmoo, ...allBooks.kobo];
  if (combined.length === 0) return;

  const data = {
    exportDate: new Date().toISOString().slice(0, 10),
    source: 'ebook-shelf-helper',
    books: combined
  };

  // Encode data in URL hash for the web tool to pick up
  const encoded = encodeURIComponent(JSON.stringify(data));
  chrome.tabs.create({ url: `${BOOK_MANAGER_URL}#import=${encoded}` });
}
