/**
 * 讀墨站內搜尋模組
 * 透過 Cloudflare Worker 搜尋讀墨書庫，一鍵加入書單
 */

function initReadmooSearch() {
  const btnToggle = document.getElementById('btn-search-readmoo');
  const panel = document.getElementById('readmoo-search-panel');
  const input = document.getElementById('readmoo-search-input');
  const btnGo = document.getElementById('btn-readmoo-go');
  const statusEl = document.getElementById('readmoo-search-status');
  const resultsEl = document.getElementById('readmoo-search-results');
  const modeBtns = document.querySelectorAll('.search-mode-btn');

  let isOpen = false;
  let debounceTimer = null;
  let isComposing = false; // 中文輸入法組字中，不觸發搜尋

  // Toggle search panel
  btnToggle.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'block' : 'none';
    if (isOpen) input.focus();
  });

  // 中文 IME 組字事件：組字中不觸發搜尋
  input.addEventListener('compositionstart', () => { isComposing = true; });
  input.addEventListener('compositionend', () => {
    isComposing = false;
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length >= 1) {
      debounceTimer = setTimeout(doSearch, 400);
    }
  });

  // Debounced search on typing (400ms)
  input.addEventListener('input', () => {
    if (isComposing) return; // 組字中跳過
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length >= 1) {
      debounceTimer = setTimeout(doSearch, 400);
    }
  });

  // Search on Enter (immediate)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      doSearch();
    }
  });

  // Search on button click (immediate)
  btnGo.addEventListener('click', () => {
    clearTimeout(debounceTimer);
    doSearch();
  });

  async function doSearch() {
    const query = input.value.trim();
    if (!query) {
      showToast('請輸入關鍵字');
      return;
    }

    statusEl.style.display = 'block';
    statusEl.innerHTML = '<div class="spinner-sm"></div> 正在搜尋讀墨...';
    resultsEl.innerHTML = '';

    try {
      // 10 秒超時，避免 fetch 卡住
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`/api/readmoo-search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const cacheHit = res.headers.get('X-Cache') === 'HIT';

      const books = data.books;

      if (books.length === 0) {
        statusEl.innerHTML = '找不到相關書籍，試試其他關鍵字？或用這個工具查查看：<a href="https://taiwan-ebook-lover.github.io/" target="_blank" rel="noopener">台灣電子書搜尋</a>';
        return;
      }

      statusEl.innerHTML = `「${escapeHtml(query)}」找到 ${books.length} 本${cacheHit ? ' <span class="cache-badge">快取</span>' : ''}`;
      renderResults(books);
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      const msg = isTimeout
        ? '連線逾時，可能是網路不穩。'
        : `搜尋失敗：${escapeHtml(err.message)}`;
      statusEl.innerHTML = `<span class="search-error">${msg}</span> <button class="btn-secondary btn-sm" id="btn-retry-search" style="margin-left:8px;">重試</button>`;
      const retryBtn = document.getElementById('btn-retry-search');
      if (retryBtn) retryBtn.addEventListener('click', doSearch);
    }
  }

  function renderResults(books) {
    const existingBooks = getBooks();
    const existingTitles = new Set(existingBooks.map(b => b.title.toLowerCase()));

    resultsEl.innerHTML = books.map(book => {
      const alreadyAdded = existingTitles.has(book.title.toLowerCase());
      return `
        <div class="rm-result-card">
          <div class="rm-result-cover">
            ${book.cover
              ? `<img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)}" loading="lazy">`
              : '<div class="rm-no-cover"><i data-lucide="book"></i></div>'
            }
          </div>
          <div class="rm-result-info">
            <div class="rm-result-title">${escapeHtml(book.title)}</div>
            <div class="rm-result-meta">
              ${book.author ? escapeHtml(book.author) : ''}
              ${book.publisher ? ' · ' + escapeHtml(book.publisher) : ''}
            </div>
            <div class="rm-result-price">
              ${book.price ? `NT$ ${book.price}` : ''}
            </div>
          </div>
          <div class="rm-result-actions">
            ${alreadyAdded
              ? '<span class="rm-already-added"><i data-lucide="check"></i> 已在書單</span>'
              : `<button class="btn-primary btn-sm rm-add-btn"
                   data-title="${escapeHtml(book.title)}"
                   data-author="${escapeHtml(book.author || '')}"
                   data-publisher="${escapeHtml(book.publisher || '')}"
                   data-price="${book.price || ''}"
                   data-cover="${escapeHtml(book.cover || '')}"
                   data-url="${escapeHtml(book.url || '')}">
                  <i data-lucide="plus"></i> 加入書單
                </button>`
            }
            <a href="${escapeHtml(book.url)}" target="_blank" rel="noopener" class="btn-secondary btn-sm">
              <i data-lucide="external-link"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
    bindAddButtons();
  }

  function bindAddButtons() {
    resultsEl.querySelectorAll('.rm-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const books = getBooks();
        books.push({
          id: 'book_' + Date.now(),
          title: btn.dataset.title,
          author: btn.dataset.author,
          version: '電子書',
          pubdate: '',
          publisher: btn.dataset.publisher,
          price: btn.dataset.price,
          cover: btn.dataset.cover,
          readmooUrl: btn.dataset.url,
          status: 'want',
          createdAt: new Date().toISOString(),
        });
        saveBooks(books);

        // Update button to "已在書單"
        btn.outerHTML = '<span class="rm-already-added"><i data-lucide="check"></i> 已在書單</span>';
        if (window.lucide) lucide.createIcons();

        showToast(`已加入書單：${btn.dataset.title}`);

        // Refresh book list if initBooks has rendered
        if (window.initBooks) {
          const booksListEl = document.getElementById('books-list');
          if (booksListEl) {
            // Trigger re-render via a custom event
            document.dispatchEvent(new Event('books-updated'));
          }
        }
      });
    });
  }
}

// Auto-init after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('readmoo-search-panel')) {
    initReadmooSearch();
  }
});

// Listen for books-updated to re-render
document.addEventListener('books-updated', () => {
  if (window._booksRender) window._booksRender();
});

window.initReadmooSearch = initReadmooSearch;
