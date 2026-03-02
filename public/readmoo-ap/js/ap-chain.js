/**
 * AP 接龍核心模組
 * 選人 → 每人配一本書 → 複製書名 → 開 AP 連結
 */

function initChain() {
  const selectAllCb = document.getElementById('chain-select-all');
  const searchEl = document.getElementById('chain-search');
  const countEl = document.getElementById('chain-selected-count');
  const memberListEl = document.getElementById('chain-member-list');
  const btnStart = document.getElementById('btn-start-chain');
  const btnExit = document.getElementById('btn-exit-chain');
  const stepSelect = document.getElementById('chain-step-select');
  const stepActive = document.getElementById('chain-step-active');
  const queueEl = document.getElementById('chain-queue');
  const noBooksEl = document.getElementById('chain-no-books');
  const progressFill = document.getElementById('chain-progress-fill');
  const progressText = document.getElementById('chain-progress-text');

  let selectedIds = new Set();
  let chainQueue = [];
  let chainDone = new Set();
  // Map: memberId → bookId
  let chainBookMap = {};

  // Render member selection grid
  function renderMembers(filter = '') {
    const members = filter
      ? AppState.members.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()))
      : AppState.members;

    memberListEl.innerHTML = members.map(m => `
      <label class="member-item ${selectedIds.has(m.id) ? 'selected' : ''}" data-id="${m.id}">
        <input type="checkbox" ${selectedIds.has(m.id) ? 'checked' : ''} data-id="${m.id}">
        <span>${escapeHtml(m.name)}</span>
      </label>
    `).join('');

    memberListEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) selectedIds.add(cb.dataset.id);
        else selectedIds.delete(cb.dataset.id);
        updateSelection();
      });
    });
  }

  function updateSelection() {
    countEl.textContent = `已選 ${selectedIds.size} 人`;
    btnStart.disabled = selectedIds.size === 0;
    selectAllCb.checked = selectedIds.size === AppState.members.length && AppState.members.length > 0;

    memberListEl.querySelectorAll('.member-item').forEach(item => {
      item.classList.toggle('selected', selectedIds.has(item.dataset.id));
    });
  }

  // Select all
  selectAllCb.addEventListener('change', () => {
    if (selectAllCb.checked) {
      AppState.members.forEach(m => selectedIds.add(m.id));
    } else {
      selectedIds.clear();
    }
    renderMembers(searchEl.value);
    updateSelection();
  });

  // Search
  searchEl.addEventListener('input', () => renderMembers(searchEl.value));

  // Start chain
  btnStart.addEventListener('click', () => {
    chainQueue = Array.from(selectedIds).map(id =>
      AppState.members.find(m => m.id === id)
    ).filter(Boolean);
    chainDone = new Set();
    chainBookMap = {};

    stepSelect.style.display = 'none';
    stepActive.style.display = 'block';
    renderChainActive();
  });

  // Exit chain
  btnExit.addEventListener('click', () => {
    if (chainDone.size < chainQueue.length) {
      if (!confirm('接龍尚未完成，確定要離開嗎？')) return;
    }
    stepSelect.style.display = 'block';
    stepActive.style.display = 'none';
  });

  // Render active chain
  function renderChainActive() {
    const books = getBooks().filter(b => b.status === 'want');
    const total = chainQueue.length;
    const done = chainDone.size;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${done} / ${total} 完成`;

    noBooksEl.style.display = books.length === 0 ? 'block' : 'none';

    queueEl.innerHTML = chainQueue.map((m, i) => {
      const isDone = chainDone.has(m.id);
      const selectedBookId = chainBookMap[m.id] || '';
      const selectedBook = books.find(b => b.id === selectedBookId);

      return `
        <div class="queue-card ${isDone ? 'done' : ''}">
          <div class="queue-card-header">
            <input type="checkbox" ${isDone ? 'checked' : ''} class="chain-done-cb" data-id="${m.id}"
                   style="accent-color: var(--color-sage);">
            <span class="queue-number">#${i + 1}</span>
            <span class="queue-name">${escapeHtml(m.name)}</span>
          </div>
          <div class="queue-card-body">
            <select class="input-field chain-book-select" data-member="${m.id}">
              <option value="">-- 選一本書 --</option>
              ${books.map(b => `<option value="${b.id}" ${b.id === selectedBookId ? 'selected' : ''}>${escapeHtml(b.title)}</option>`).join('')}
            </select>
            <button class="btn-icon chain-copy-btn" data-member="${m.id}" title="複製書名"
                    ${!selectedBook ? 'disabled' : ''}>
              <i data-lucide="copy"></i>
            </button>
            <a href="${escapeHtml(m.link)}" target="_blank" rel="noopener"
               class="btn-primary btn-sm btn-open-ap">
              <i data-lucide="external-link"></i> AP 連結
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Bind events
    queueEl.querySelectorAll('.chain-done-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const memberId = cb.dataset.id;
        if (cb.checked) {
          chainDone.add(memberId);
          // Mark the paired book as bought
          const bookId = chainBookMap[memberId];
          if (bookId) {
            const allBooks = getBooks();
            const book = allBooks.find(b => b.id === bookId);
            if (book && book.status === 'want') {
              const member = chainQueue.find(m => m.id === memberId);
              book.status = 'bought';
              book.purchaseDate = new Date().toISOString().split('T')[0];
              book.purchaseVia = member ? member.name : '';
              saveBooks(allBooks);
              showToast(`已標記購買：${book.title}`);
              document.dispatchEvent(new Event('books-updated'));
            }
          }
        } else {
          chainDone.delete(memberId);
        }
        renderChainActive();
      });
    });

    queueEl.querySelectorAll('.chain-book-select').forEach(sel => {
      sel.addEventListener('change', () => {
        chainBookMap[sel.dataset.member] = sel.value;
        // Re-render to update copy button state
        renderChainActive();
      });
    });

    queueEl.querySelectorAll('.chain-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bookId = chainBookMap[btn.dataset.member];
        const book = books.find(b => b.id === bookId);
        if (book) copyToClipboard(book.title);
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  // Initial render
  renderMembers();
  updateSelection();
}

// Copy helper
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`已複製：${text}`);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`已複製：${text}`);
  });
}

window.initChain = initChain;
window.copyToClipboard = copyToClipboard;
