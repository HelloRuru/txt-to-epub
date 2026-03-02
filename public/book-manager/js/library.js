// ─── Book Manager — Library + Dedup + Stats + Export ───

let currentFilter = 'all';
let searchQuery = '';

function initLibrary() {
  // Search
  document.getElementById('library-search').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderLibrary();
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderLibrary();
    });
  });

  // Export buttons
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-export-text').addEventListener('click', exportText);
  document.getElementById('btn-export-dupes').addEventListener('click', exportDupes);
  document.getElementById('btn-clear-all').addEventListener('click', clearAll);

  // Listen for state changes
  AppState.on(() => {
    renderLibrary();
    renderStats();
    updateBadge();
  });

  // Initial render
  renderLibrary();
  renderStats();
  updateBadge();
}

// ── Badge ─────────────────────────────────────────

function updateBadge() {
  const badge = document.getElementById('badge-library');
  const count = AppState.books.length;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

// ── Render Library ────────────────────────────────

function renderLibrary() {
  const bookList = document.getElementById('book-list');
  const dupGroups = document.getElementById('duplicate-groups');
  const info = document.getElementById('library-info');
  const empty = document.getElementById('empty-library');

  if (AppState.books.length === 0) {
    bookList.innerHTML = '';
    bookList.appendChild(empty.cloneNode(true)).style.display = '';
    dupGroups.innerHTML = '';
    info.textContent = '';
    return;
  }

  // Find duplicates
  const dupes = findDuplicates(AppState.books);
  const dupeIds = new Set();
  for (const group of Object.values(dupes)) {
    for (const book of group) dupeIds.add(book.id);
  }

  // Filter books
  let filtered = AppState.books;
  if (currentFilter === 'duplicate') {
    filtered = filtered.filter(b => dupeIds.has(b.id));
  } else if (currentFilter !== 'all') {
    filtered = filtered.filter(b => b.platform === currentFilter);
  }

  // Search
  if (searchQuery) {
    filtered = filtered.filter(b =>
      (b.title || '').toLowerCase().includes(searchQuery) ||
      (b.author || '').toLowerCase().includes(searchQuery)
    );
  }

  // Info text
  const dupeCount = Object.keys(dupes).length;
  info.textContent = `${filtered.length} 本${currentFilter !== 'all' ? '（篩選中）' : ''} · ${dupeCount} 組重複`;

  // Render duplicate groups first
  dupGroups.innerHTML = '';
  if (currentFilter === 'all' || currentFilter === 'duplicate') {
    for (const [key, group] of Object.entries(dupes)) {
      // Check if any book in group matches search
      if (searchQuery && !group.some(b =>
        (b.title || '').toLowerCase().includes(searchQuery) ||
        (b.author || '').toLowerCase().includes(searchQuery)
      )) continue;

      const groupEl = document.createElement('div');
      groupEl.className = 'dup-group';

      const platforms = [...new Set(group.map(b => b.platform))];
      const isXPlatform = platforms.length > 1;

      groupEl.innerHTML = `
        <div class="dup-group-header">
          <i data-lucide="${isXPlatform ? 'alert-triangle' : 'copy'}" width="16" height="16"></i>
          ${isXPlatform ? '跨平台重複' : '同平台重複'} — ${group.length} 本
        </div>
      `;

      for (const book of group) {
        groupEl.appendChild(createBookCard(book, true));
      }
      dupGroups.appendChild(groupEl);
    }
  }

  // Render non-duplicate books (or all when filtered)
  bookList.innerHTML = '';
  const nonDupes = currentFilter === 'duplicate'
    ? [] // Already shown in groups
    : filtered.filter(b => !dupeIds.has(b.id) || currentFilter !== 'all');

  // When showing duplicates filter, show flat list instead
  const toRender = currentFilter === 'duplicate' ? filtered : nonDupes;

  if (currentFilter !== 'duplicate') {
    for (const book of toRender) {
      bookList.appendChild(createBookCard(book, false));
    }
  }

  if (filtered.length === 0 && Object.keys(dupes).length === 0) {
    const emptyEl = empty.cloneNode(true);
    emptyEl.style.display = '';
    emptyEl.querySelector('p').textContent = '沒有符合的結果';
    bookList.appendChild(emptyEl);
  }

  lucide.createIcons();
}

function createBookCard(book, inDupGroup) {
  const card = document.createElement('div');
  card.className = 'book-card';
  if (!inDupGroup && book._isDuplicate) card.classList.add('is-duplicate');

  const platformColor = PLATFORMS[book.platform]?.color || '#888';
  card.style.setProperty('--platform-color', platformColor);

  card.innerHTML = `
    <div class="book-info">
      <div class="book-title">${escapeHtml(book.title)}</div>
      ${book.author ? `<div class="book-author">${escapeHtml(book.author)}</div>` : ''}
    </div>
    <span class="platform-badge badge-${book.platform}">${PLATFORMS[book.platform]?.name || book.platform}</span>
    <div class="book-actions">
      <button class="btn-icon" title="刪除" data-delete="${book.id}">
        <i data-lucide="trash-2" width="14" height="14"></i>
      </button>
    </div>
  `;

  card.querySelector('[data-delete]').addEventListener('click', (e) => {
    e.stopPropagation();
    AppState.removeBook(book.id);
    showToast('已刪除');
  });

  return card;
}

// ── Stats ─────────────────────────────────────────

function renderStats() {
  const books = AppState.books;
  const dupes = findDuplicates(books);
  const dupeBookCount = Object.values(dupes).reduce((sum, g) => sum + g.length, 0);

  document.getElementById('stat-total').textContent = books.length;
  document.getElementById('stat-duplicates').textContent = dupeBookCount;
  document.getElementById('stat-readmoo').textContent = books.filter(b => b.platform === 'readmoo').length;
  document.getElementById('stat-kobo').textContent = books.filter(b => b.platform === 'kobo').length;
  document.getElementById('stat-calibre').textContent = books.filter(b => b.platform === 'calibre').length;

  // Pie chart
  renderPieChart();
}

function renderPieChart() {
  const chart = document.getElementById('pie-chart');
  const books = AppState.books;
  if (books.length === 0) {
    chart.innerHTML = '<div class="empty-state" style="padding:40px 0"><p>尚無資料</p></div>';
    return;
  }

  const counts = {};
  for (const b of books) {
    counts[b.platform] = (counts[b.platform] || 0) + 1;
  }

  // Build conic-gradient
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = books.length;
  let angle = 0;
  const gradientParts = [];

  for (const [platform, count] of entries) {
    const color = PLATFORMS[platform]?.color || '#888';
    const pct = (count / total) * 100;
    gradientParts.push(`${color} ${angle}% ${angle + pct}%`);
    angle += pct;
  }

  chart.style.background = `conic-gradient(${gradientParts.join(', ')})`;
  chart.innerHTML = '';

  // Legend below chart
  let legend = chart.parentElement.querySelector('.pie-legend');
  if (legend) legend.remove();
  legend = document.createElement('div');
  legend.className = 'pie-legend';

  for (const [platform, count] of entries) {
    const color = PLATFORMS[platform]?.color || '#888';
    const name = PLATFORMS[platform]?.name || platform;
    legend.innerHTML += `
      <div class="pie-legend-item">
        <span class="pie-legend-dot" style="background:${color}"></span>
        ${name} (${count})
      </div>
    `;
  }
  chart.parentElement.appendChild(legend);
}

// ── Export ─────────────────────────────────────────

function exportJSON() {
  if (AppState.books.length === 0) { showToast('書櫃是空的'); return; }
  const data = {
    exportDate: new Date().toISOString().slice(0, 10),
    source: 'book-manager',
    books: AppState.books
  };
  downloadFile(
    JSON.stringify(data, null, 2),
    `book-manager_${data.exportDate}.json`,
    'application/json'
  );
}

function exportCSV() {
  if (AppState.books.length === 0) { showToast('書櫃是空的'); return; }

  // Use SheetJS if available
  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.json_to_sheet(
      AppState.books.map(b => ({
        書名: b.title,
        作者: b.author || '',
        平台: PLATFORMS[b.platform]?.name || b.platform,
        匯入日期: b.addedAt?.slice(0, 10) || ''
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '書櫃');
    XLSX.writeFile(wb, `book-manager_${new Date().toISOString().slice(0, 10)}.csv`);
  } else {
    // Fallback: manual CSV
    const lines = ['書名,作者,平台'];
    for (const b of AppState.books) {
      lines.push(`"${b.title}","${b.author || ''}","${PLATFORMS[b.platform]?.name || b.platform}"`);
    }
    downloadFile(lines.join('\n'), `book-manager_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }
  showToast('CSV 已下載');
}

function exportText() {
  if (AppState.books.length === 0) { showToast('書櫃是空的'); return; }

  const lines = AppState.books.map((b, i) =>
    `${i + 1}. [${PLATFORMS[b.platform]?.name || b.platform}] ${b.title}${b.author ? ` — ${b.author}` : ''}`
  );
  downloadFile(lines.join('\n'), `book-manager_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain');
  showToast('純文字已下載');
}

function exportDupes() {
  const dupes = findDuplicates(AppState.books);
  const groups = Object.values(dupes);
  if (groups.length === 0) { showToast('沒有重複書'); return; }

  const lines = [];
  for (const group of groups) {
    const title = group[0].title;
    const platforms = group.map(b => PLATFORMS[b.platform]?.name || b.platform).join(' + ');
    lines.push(`${title} → ${platforms}（${group.length} 本）`);
  }
  downloadFile(lines.join('\n'), `duplicates_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain');
  showToast('重複書清單已下載');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Clear All ─────────────────────────────────────

function clearAll() {
  if (!confirm('確定要清空全部書櫃資料嗎？此操作無法復原。')) return;
  AppState.clearAll();
  showToast('書櫃已清空');
}

// ── Stats Init ────────────────────────────────────

function initStats() {
  // Stats auto-update via AppState.on() in initLibrary
}
