// ─── Book Manager — Unified App ───
// Bookmarklet 掃 DOM → 去重 → 匯出

const STORAGE_KEY = 'bookManager_books';
const PLATFORMS = {
  readmoo: { name: '讀墨', color: '#00C1FF' },
  kobo:    { name: 'Kobo', color: '#BF0000' },
  calibre: { name: '本機', color: '#06A865' }
};

const CATEGORIES = [
  '文學小說', '推理', '科幻', '奇幻', '愛情', '歷史小說', '輕小說',
  '商業', '自我成長', '心理', '哲學', '歷史', '科學',
  '社會', '傳記', '漫畫', '生活', '藝術', '教育',
  '兒少', '身心靈', '語言', '工具書', '其他'
];

// ══════════════════════════════════════════════════
// Readmoo Bookmarklet Code
// ══════════════════════════════════════════════════

function getReadmooBookmarklet() {
  // Bookmarklet v4：直接掃書櫃頁面 DOM（div.title），不碰 token
  // 自動捲動載入全部書籍 → base64 帶回 book-manager
  const code = `void(function(){try{`
    + `if(!location.hostname.includes('readmoo')){alert('請先到 read.readmoo.com 書櫃頁面');return}`
    + `var c=document.querySelector('.mo-bookcase')||document.scrollingElement||document.body,`
    + `last=0,tries=0;`
    // ── 捲動載入所有書 ──
    + `function go(){`
    + `var els=document.querySelectorAll('div.title');`
    + `if(els.length===last){tries++;if(tries>=3){done(els);return}}`
    + `else{tries=0;last=els.length}`
    + `c.scrollTop=c.scrollHeight;window.scrollTo(0,document.body.scrollHeight);`
    + `setTimeout(go,600)}`
    // ── 收集並跳轉 ──
    + `function done(els){`
    + `var b=[],s=new Set();`
    + `els.forEach(function(e){var n=e.textContent.trim();if(n&&!s.has(n)){s.add(n);b.push([n])}});`
    + `if(!b.length){alert('找不到書籍，請確認已開啟書櫃');return}`
    + `if(confirm('找到 '+b.length+' 本書，匯入到書櫃管理工具？')){`
    + `location.href='https://tools.helloruru.com/book-manager/#readmoo='`
    + `+btoa(unescape(encodeURIComponent(JSON.stringify(b))))}}`
    + `go()`
    + `}catch(e){alert('錯誤：'+e.message)}}())`;
  return 'javascript:' + code;
}

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
  const saved = localStorage.getItem('helloruru-theme');

  const applyDark = (isDark) => {
    document.documentElement.classList.toggle('dark', isDark);
    const icon = btn?.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      lucide.createIcons();
    }
  };

  if (saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)) {
    applyDark(true);
  }

  btn?.addEventListener('click', () => {
    const isDark = !document.documentElement.classList.contains('dark');
    localStorage.setItem('helloruru-theme', isDark ? 'dark' : 'light');
    applyDark(isDark);
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
    .replace(/[（(]/g, '(').replace(/[）)]/g, ')')
    .replace(/[【\[]/g, '[').replace(/[】\]]/g, ']')
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
let categoryFilter = '';

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

  // Category filter
  if (categoryFilter === '__none__') {
    filtered = filtered.filter(b => !b.category);
  } else if (categoryFilter) {
    filtered = filtered.filter(b => b.category === categoryFilter);
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

  updateCategoryFilter();
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

  // 分類下拉
  const catSelect = document.createElement('select');
  catSelect.className = 'book-category';
  catSelect.innerHTML = '<option value="">—</option>' +
    CATEGORIES.map(c => `<option value="${c}"${book.category === c ? ' selected' : ''}>${c}</option>`).join('');
  catSelect.addEventListener('change', () => {
    book.category = catSelect.value || '';
    AppState.save();
    updateCategoryFilter();
  });
  el.insertBefore(catSelect, el.querySelector('.book-badge'));

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

  const lines = ['書名,作者,平台,分類,重複'];
  const dupes = findDuplicates(AppState.books);
  const dupeIds = new Set();
  for (const group of Object.values(dupes)) {
    for (const book of group) dupeIds.add(book.id);
  }

  for (const b of sortBooks(AppState.books)) {
    const pName = PLATFORMS[b.platform]?.name || b.platform;
    const isDupe = dupeIds.has(b.id) ? '是' : '';
    const cat = b.category || '';
    lines.push(`"${(b.title || '').replace(/"/g, '""')}","${(b.author || '').replace(/"/g, '""')}","${pName}","${cat}","${isDupe}"`);
  }

  downloadFile(lines.join('\n'), `book-manager_${today()}.csv`, 'text/csv');
  showToast('CSV 已下載，可用 Excel 開啟');
}

function exportPlainText() {
  if (AppState.books.length === 0) { showToast('書櫃是空的'); return; }

  const dupes = findDuplicates(AppState.books);
  const dupeIds = new Set();
  for (const group of Object.values(dupes)) {
    for (const book of group) dupeIds.add(book.id);
  }

  const lines = [];
  lines.push('讀墨書櫃整理 — 書單匯出');
  lines.push(`日期：${today()}`);
  lines.push(`共 ${AppState.books.length} 本`);
  lines.push('');

  // 按平台分組
  for (const [key, info] of Object.entries(PLATFORMS)) {
    const platBooks = sortBooks(AppState.books.filter(b => b.platform === key));
    if (platBooks.length === 0) continue;

    lines.push(`── ${info.name} (${platBooks.length} 本) ──`);
    platBooks.forEach((b, i) => {
      const author = b.author ? ` / ${b.author}` : '';
      const cat = b.category ? ` [${b.category}]` : '';
      const dup = dupeIds.has(b.id) ? ' [重複]' : '';
      lines.push(`${i + 1}. ${b.title}${author}${cat}${dup}`);
    });
    lines.push('');
  }

  // 重複摘要
  const dupeEntries = Object.values(dupes);
  if (dupeEntries.length > 0) {
    lines.push(`── 重複書籍 (${dupeEntries.length} 組) ──`);
    for (const group of dupeEntries) {
      const platforms = [...new Set(group.map(b => PLATFORMS[b.platform]?.name || b.platform))].join(', ');
      lines.push(`- ${group[0].title} (${platforms})`);
    }
    lines.push('');
  }

  downloadFile(lines.join('\n'), `book-manager_${today()}.txt`, 'text/plain');
  showToast('純文字已下載');
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
// Classify (自動分類 — 純前端關鍵字比對)
// ══════════════════════════════════════════════════

const CLASSIFY_RULES = [
  // ── 格式標記（括號內，最優先）──
  { re: /[（(]漫畫[）)]/, cat: '漫畫' },
  { re: /[（(]輕小說[）)]/, cat: '輕小說' },
  { re: /[（(]小說[）)]/, cat: '文學小說' },

  // ── 漫畫 ──
  { re: /漫畫|COMIC|コミック/i, cat: '漫畫' },

  // ── 輕小說 ──
  { re: /輕小說|ライトノベル/i, cat: '輕小說' },

  // ── 推理 ──
  { re: /推理|偵探|殺人|密室|謀殺|懸疑|犯罪|兇手|詭計|凶手|事件簿|密碼/i, cat: '推理' },

  // ── 科幻 ──
  { re: /科幻|末日|星際|賽博|人工智慧|機器人|太空|反烏托邦/i, cat: '科幻' },

  // ── 奇幻 ──
  { re: /奇幻|魔法|龍族|精靈|魔王|勇者|異世界/i, cat: '奇幻' },

  // ── 愛情 ──
  { re: /愛情|戀愛|純愛|言情|甜寵|羅曼史/i, cat: '愛情' },

  // ── 歷史小說 ──
  { re: /歷史小說/i, cat: '歷史小說' },

  // ── 商業 ──
  { re: /投資|理財|經濟|商業|管理學|行銷|創業|財富|股票|基金|會計|領導|策略|談判|金融|企業/i, cat: '商業' },

  // ── 自我成長 ──
  { re: /習慣|時間管理|思考術|溝通術|說話術|勵志|致富|高效|效率|自律|成功法則/i, cat: '自我成長' },

  // ── 心理 ──
  { re: /心理學|心理治療|情緒|焦慮|憂鬱|療癒|創傷|依附|精神科|情緒勒索|依戀|內在小孩/i, cat: '心理' },

  // ── 哲學 ──
  { re: /哲學|存在主義|倫理學|尼采|柏拉圖|蘇格拉底/i, cat: '哲學' },

  // ── 歷史 ──
  { re: /歷史|文明史|帝國|世界史|人類大歷史|大歷史/i, cat: '歷史' },

  // ── 科學 ──
  { re: /科學|物理學|化學|生物學|數學|醫學|宇宙|量子|基因|演化|天文|科普|大腦|神經/i, cat: '科學' },

  // ── 社會 ──
  { re: /社會學|政治|法律|民主|資本主義|階級|不平等|新聞學/i, cat: '社會' },

  // ── 傳記 ──
  { re: /傳記|自傳|回憶錄|生平/i, cat: '傳記' },

  // ── 藝術 ──
  { re: /藝術|設計|攝影|音樂|建築|美學|繪畫|電影|插畫/i, cat: '藝術' },

  // ── 教育 ──
  { re: /教育|教學法|學習法|教養|育兒/i, cat: '教育' },

  // ── 語言 ──
  { re: /英文|日文|英語|日語|韓語|語言學|單字|文法|會話|TOEIC|TOEFL|多益/i, cat: '語言' },

  // ── 兒少 ──
  { re: /兒童|青少年|繪本|童話/i, cat: '兒少' },

  // ── 身心靈 ──
  { re: /靈修|冥想|佛學|禪修|瑜伽|占星|塔羅|能量|靈性|宗教|心靈/i, cat: '身心靈' },

  // ── 生活 ──
  { re: /料理|食譜|烘焙|旅行|旅遊|健康|運動|減肥|瘦身|收納|整理|手作|園藝/i, cat: '生活' },

  // ── 工具書 ──
  { re: /字典|辭典|百科|手冊|指南/i, cat: '工具書' },
];

function classifyByKeyword(title) {
  if (!title) return null;
  for (const rule of CLASSIFY_RULES) {
    if (rule.re.test(title)) return rule.cat;
  }
  return null;
}

function classifyBooks() {
  const unclassified = AppState.books.filter(b => !b.category);
  if (unclassified.length === 0) {
    showToast('所有書都已分類');
    return;
  }

  let classified = 0;
  for (const book of unclassified) {
    const cat = classifyByKeyword(book.title);
    if (cat) {
      book.category = cat;
      classified++;
    }
  }

  AppState.save();
  AppState.notify();

  const remaining = unclassified.length - classified;
  if (remaining > 0) {
    showToast(`已分類 ${classified} 本，${remaining} 本需手動分類`);
  } else {
    showToast(`已分類 ${classified} 本`);
  }
}

function updateCategoryFilter() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  const cats = [...new Set(AppState.books.map(b => b.category).filter(Boolean))].sort();
  const uncategorized = AppState.books.filter(b => !b.category).length;

  const current = select.value;
  select.innerHTML = '<option value="">所有分類</option>';
  if (uncategorized > 0) {
    select.innerHTML += `<option value="__none__">未分類 (${uncategorized})</option>`;
  }
  for (const cat of cats) {
    const count = AppState.books.filter(b => b.category === cat).length;
    select.innerHTML += `<option value="${cat}">${cat} (${count})</option>`;
  }
  select.value = current;
}

// ══════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}


// ══════════════════════════════════════════════════
// Hash Import (Bookmarklet v4 帶回的書單資料)
// ══════════════════════════════════════════════════

function checkHashImport() {
  const hash = location.hash;
  if (!hash) return;

  // 格式：#readmoo=BASE64_JSON 或 #kobo=BASE64_JSON
  const match = hash.match(/^#(readmoo|kobo)=(.+)$/);
  if (!match) return;

  const platform = match[1];
  const b64 = match[2];

  try {
    const json = decodeURIComponent(escape(atob(b64)));
    const compact = JSON.parse(json);

    if (!Array.isArray(compact) || compact.length === 0) {
      showToast('匯入資料為空');
      return;
    }

    const books = compact.map(item => ({
      title: Array.isArray(item) ? item[0] || '' : item.title || '',
      author: Array.isArray(item) ? item[1] || '' : item.author || '',
      platform
    }));

    // 去除已存在的
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

    // 更新 UI
    const statusEl = document.getElementById(`status-${platform}`);
    const resultEl = document.getElementById(`result-${platform}`);
    if (statusEl) {
      statusEl.textContent = '已連接';
      statusEl.className = 'platform-status ok';
    }
    if (resultEl) {
      resultEl.className = 'platform-result';
      resultEl.innerHTML = `<strong>${books.length}</strong> 本書（Bookmarklet 匯入）` +
        (skipCount > 0 ? `<br>${skipCount} 本已存在，新增 ${newBooks.length} 本` : '');
      resultEl.style.display = '';
    }

    showToast(`${PLATFORMS[platform].name}：成功匯入 ${books.length} 本`);
    showLibrary();
  } catch (err) {
    showToast('匯入失敗：資料格式錯誤');
  } finally {
    history.replaceState(null, '', location.pathname);
  }
}

// ══════════════════════════════════════════════════
// Bookmarklet Init
// ══════════════════════════════════════════════════

function initBookmarklets() {
  // 設定讀墨 Bookmarklet 連結
  const bmLink = document.getElementById('bm-link-readmoo');
  if (bmLink) {
    bmLink.href = getReadmooBookmarklet();
    // 在本頁點擊時不執行（要在 readmoo.com 上用才有效）
    bmLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('請把這個按鈕拖到書籤列，在讀墨網站上使用');
    });
  }

  // 複製按鈕
  const copyBtn = document.getElementById('btn-copy-bm');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = getReadmooBookmarklet();
      navigator.clipboard.writeText(code).then(() => {
        showToast('已複製！新增書籤後貼上網址即可');
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('已複製！新增書籤後貼上網址即可');
      });
    });
  }
}

// ══════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  AppState.load();
  initDarkMode();
  initBookmarklets();

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

  // ── Export ──
  document.getElementById('btn-export').addEventListener('click', exportCSV);
  document.getElementById('btn-export-txt')?.addEventListener('click', exportPlainText);

  // ── Classify ──
  document.getElementById('btn-classify')?.addEventListener('click', classifyBooks);

  // ── Category filter ──
  const catFilter = document.getElementById('filter-category');
  if (catFilter) {
    catFilter.addEventListener('change', () => {
      categoryFilter = catFilter.value;
      renderLibrary();
    });
  }

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

  // ── 檢查 Bookmarklet 帶回的資料 ──
  checkHashImport();
});
