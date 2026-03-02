// ─── Book Manager — Import ───

function initImport() {
  // Drop zone
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
    fileInput.value = '';
  });

  // Paste import
  document.getElementById('btn-paste-import').addEventListener('click', handlePaste);

  // CSV upload
  const csvInput = document.getElementById('csv-input');
  document.getElementById('btn-csv-upload').addEventListener('click', () => csvInput.click());
  csvInput.addEventListener('change', () => {
    if (csvInput.files[0]) handleCSV(csvInput.files[0]);
    csvInput.value = '';
  });

  // Modal
  document.getElementById('btn-preview-close').addEventListener('click', closePreview);
  document.getElementById('btn-preview-cancel').addEventListener('click', closePreview);
  document.getElementById('btn-preview-confirm').addEventListener('click', confirmImport);
}

// ── File Handler (JSON) ───────────────────────────

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if (file.name.endsWith('.csv')) {
        parseCSVContent(e.target.result, 'calibre');
        return;
      }
      const data = JSON.parse(e.target.result);
      let books = [];

      // Support extension format
      if (data.books && Array.isArray(data.books)) {
        books = data.books;
      }
      // Support plain array
      else if (Array.isArray(data)) {
        books = data;
      }

      if (books.length === 0) {
        showToast('檔案中沒有找到書籍資料');
        return;
      }

      // Ensure required fields
      books = books.map(b => ({
        title: b.title || b.書名 || b.Title || '',
        author: b.author || b.作者 || b.Author || '',
        platform: b.platform || 'calibre'
      })).filter(b => b.title.trim());

      showImportPreview(books);
    } catch (err) {
      showToast('檔案格式錯誤：' + err.message);
    }
  };
  reader.readAsText(file);
}

// ── Paste Handler ─────────────────────────────────

function handlePaste() {
  const text = document.getElementById('paste-area').value.trim();
  if (!text) { showToast('請先貼上書名'); return; }

  const platform = document.getElementById('paste-platform').value;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const books = lines.map(line => {
    // Try to split by comma, tab, or |
    const parts = line.split(/[,，\t|]/).map(s => s.trim());
    return {
      title: parts[0] || '',
      author: parts[1] || '',
      platform
    };
  }).filter(b => b.title);

  if (books.length === 0) { showToast('未偵測到有效書名'); return; }
  showImportPreview(books);
}

// ── CSV Handler ───────────────────────────────────

function handleCSV(file) {
  const platform = document.getElementById('csv-platform').value;
  const reader = new FileReader();
  reader.onload = (e) => parseCSVContent(e.target.result, platform);
  reader.readAsText(file);
}

function parseCSVContent(text, platform) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) { showToast('CSV 至少需要標題列 + 1 筆資料'); return; }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const titleIdx = headers.findIndex(h => ['title', '書名', 'book', 'name'].includes(h));
  const authorIdx = headers.findIndex(h => ['author', '作者', 'writer'].includes(h));

  if (titleIdx === -1) {
    showToast('CSV 找不到書名欄位（需有 title 或 書名 欄位）');
    return;
  }

  const books = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const title = (cols[titleIdx] || '').trim();
    if (!title) continue;
    books.push({
      title,
      author: authorIdx >= 0 ? (cols[authorIdx] || '').trim() : '',
      platform
    });
  }

  if (books.length === 0) { showToast('CSV 中無有效資料'); return; }
  showImportPreview(books);
}

// Simple CSV line parser (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Preview Modal ─────────────────────────────────

window._pendingImport = null;

function showImportPreview(books) {
  window._pendingImport = books;

  // Count by platform
  const counts = {};
  for (const b of books) {
    counts[b.platform] = (counts[b.platform] || 0) + 1;
  }
  const countStr = Object.entries(counts)
    .map(([p, n]) => `${PLATFORMS[p]?.name || p} ${n} 本`)
    .join('、');

  document.getElementById('preview-summary').textContent =
    `共 ${books.length} 本（${countStr}）`;

  // Check for already existing duplicates
  const existingTitles = new Set(AppState.books.map(b => normalizeTitle(b.title)));
  const dupeCount = books.filter(b => existingTitles.has(normalizeTitle(b.title))).length;

  const list = document.getElementById('preview-list');
  list.innerHTML = '';

  // Show first 50 books + "and N more"
  const show = books.slice(0, 50);
  for (const book of show) {
    const isDupe = existingTitles.has(normalizeTitle(book.title));
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `
      <span class="platform-badge badge-${book.platform}">${PLATFORMS[book.platform]?.name || book.platform}</span>
      <span>${escapeHtml(book.title)}</span>
      ${book.author ? `<span style="color:var(--color-text-muted)">— ${escapeHtml(book.author)}</span>` : ''}
      ${isDupe ? '<span style="color:var(--color-warning);font-size:11px">已存在</span>' : ''}
    `;
    list.appendChild(div);
  }

  if (books.length > 50) {
    const more = document.createElement('div');
    more.className = 'preview-item';
    more.style.color = 'var(--color-text-muted)';
    more.textContent = `...還有 ${books.length - 50} 本`;
    list.appendChild(more);
  }

  if (dupeCount > 0) {
    const warn = document.createElement('p');
    warn.style.cssText = 'margin-top:8px;color:var(--color-warning);font-size:13px';
    warn.textContent = `注意：${dupeCount} 本書已經在書櫃中`;
    list.prepend(warn);
  }

  document.getElementById('modal-preview').style.display = 'flex';
}

function closePreview() {
  document.getElementById('modal-preview').style.display = 'none';
  window._pendingImport = null;
}

function confirmImport() {
  if (!window._pendingImport) return;
  AppState.addBooks(window._pendingImport);
  showToast(`成功匯入 ${window._pendingImport.length} 本書`);
  closePreview();
  document.getElementById('paste-area').value = '';

  // Switch to library tab
  document.querySelector('[data-tab="library"]').click();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
