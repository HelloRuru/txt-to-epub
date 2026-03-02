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

  let isOpen = false;

  // Toggle search panel
  btnToggle.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'block' : 'none';
    if (isOpen) input.focus();
  });

  // Search on Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // Search on button click
  btnGo.addEventListener('click', doSearch);

  async function doSearch() {
    const query = input.value.trim();
    if (!query) {
      showToast('請輸入書名');
      return;
    }

    statusEl.style.display = 'block';
    statusEl.innerHTML = '<div class="spinner-sm"></div> 正在搜尋讀墨...';
    resultsEl.innerHTML = '';

    try {
      const apiBase = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
        ? '' : '';
      const res = await fetch(`/api/readmoo-search?q=${encodeURIComponent(query)}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const cacheHit = res.headers.get('X-Cache') === 'HIT';

      if (data.books.length === 0) {
        statusEl.innerHTML = '找不到相關書籍，試試其他關鍵字？';
        return;
      }

      statusEl.innerHTML = `找到 ${data.count} 本${cacheHit ? ' <span class="cache-badge">快取</span>' : ''}`;
      renderResults(data.books);
    } catch (err) {
      statusEl.innerHTML = `<span class="search-error">搜尋失敗：${escapeHtml(err.message)}</span>`;
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
