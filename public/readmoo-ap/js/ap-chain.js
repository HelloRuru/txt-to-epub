/**
 * AP 接龍核心模組
 * 選人 → 配書 → 開連結
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
  const booklistEl = document.getElementById('chain-booklist');
  const noBooksEl = document.getElementById('chain-no-books');
  const progressFill = document.getElementById('chain-progress-fill');
  const progressText = document.getElementById('chain-progress-text');

  let selectedIds = new Set();
  let chainQueue = [];
  let chainDone = new Set();

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
    // Progress
    const total = chainQueue.length;
    const done = chainDone.size;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${done} / ${total} 完成`;

    // Queue
    queueEl.innerHTML = chainQueue.map((m, i) => {
      const isDone = chainDone.has(m.id);
      const isCurrent = !isDone && (i === 0 || chainDone.has(chainQueue[i - 1]?.id));
      return `
        <div class="queue-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
          <input type="checkbox" ${isDone ? 'checked' : ''} class="chain-done-cb" data-id="${m.id}"
                 style="accent-color: var(--color-sage);">
          <span class="member-name">${isDone ? '&#10003; ' : ''}${escapeHtml(m.name)}</span>
          <a href="${escapeHtml(m.link)}" target="_blank" rel="noopener"
             class="btn-secondary btn-sm btn-open-ap"
             onclick="showToast('已開啟 ${escapeHtml(m.name)} 的 AP 連結')">
            <i data-lucide="external-link"></i> 開啟 AP
          </a>
        </div>
      `;
    }).join('');

    // Done checkboxes
    queueEl.querySelectorAll('.chain-done-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) chainDone.add(cb.dataset.id);
        else chainDone.delete(cb.dataset.id);
        renderChainActive();
      });
    });

    // Books
    const books = getBooks().filter(b => b.status === 'want');
    if (books.length === 0) {
      booklistEl.innerHTML = '';
      noBooksEl.style.display = 'block';
    } else {
      noBooksEl.style.display = 'none';
      booklistEl.innerHTML = books.map(b => `
        <div class="chain-book-item">
          <span class="book-name">${escapeHtml(b.title)}</span>
          <button class="btn-icon" onclick="copyToClipboard('${escapeHtml(b.title)}')" title="複製書名">
            <i data-lucide="copy"></i>
          </button>
        </div>
      `).join('');
    }

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
