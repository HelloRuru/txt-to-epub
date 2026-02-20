/* ─── Card Maker — Templates ─── */

const SIZES = {
  'square':  { w: 1080, h: 1080, label: '1080 x 1080 px' },
  'story':   { w: 1080, h: 1920, label: '1080 x 1920 px' },
  'wide':    { w: 1920, h: 1080, label: '1920 x 1080 px' },
};

const THEMES = ['rose', 'lavender', 'sage', 'warm', 'cool'];

const TEXTURES = ['none', 'washi', 'watercolor', 'kraft', 'linen', 'torn'];

const TEMPLATES = {
  'tool-intro': {
    name: '工具介紹',
    fields: [
      { id: 'pill',     label: '類別標籤',   placeholder: 'AI 生財工具 #1',              maxLength: 24 },
      { id: 'title',    label: '工具名稱',   placeholder: 'Typeless',                    maxLength: 30 },
      { id: 'subtitle', label: '一句話說明',  placeholder: '語音轉文字，支援所有 App',     maxLength: 60 },
    ],
    hasImage: true,
    render(data, theme, size, imageUrl, texture) {
      const imageHtml = imageUrl
        ? `<div class="card-image-wrap"><img src="${imageUrl}" alt=""></div>`
        : `<div class="card-image-placeholder">上傳截圖預覽</div>`;
      const tx = texture && texture !== 'none' ? ` texture-${texture}` : '';

      return `
        <div class="card theme-${theme} size-${size}${tx}">
          ${data.pill ? `<div class="card-pill">${esc(data.pill)}</div>` : ''}
          <div class="card-title">${esc(data.title) || '工具名稱'}</div>
          ${data.subtitle ? `<div class="card-subtitle">${esc(data.subtitle)}</div>` : ''}
          ${imageHtml}
          ${this._watermark()}
        </div>`;
    },
  },

  'quote': {
    name: '金句卡',
    fields: [
      { id: 'quote',  label: '金句',   placeholder: '最好的時間就是現在',  type: 'textarea', maxLength: 120 },
      { id: 'author', label: '出處',   placeholder: '— 一行禪師',         maxLength: 40 },
    ],
    hasImage: false,
    render(data, theme, size, imageUrl, texture) {
      const tx = texture && texture !== 'none' ? ` texture-${texture}` : '';
      return `
        <div class="card theme-${theme} size-${size}${tx}">
          <div class="card-quote-mark">"</div>
          <div class="card-quote">${(esc(data.quote) || '在這裡輸入金句').replace(/\n/g, '<br>')}</div>
          <div class="card-divider"></div>
          ${data.author ? `<div class="card-quote-author">${esc(data.author)}</div>` : ''}
          ${this._watermark()}
        </div>`;
    },
  },

  'list': {
    name: '重點清單',
    fields: [
      { id: 'title', label: '標題',        placeholder: '今天學到的 5 件事',    maxLength: 40 },
      { id: 'item1', label: '第 1 項',     placeholder: '保持好奇心',           maxLength: 50 },
      { id: 'item2', label: '第 2 項',     placeholder: '每天閱讀 30 分鐘',     maxLength: 50 },
      { id: 'item3', label: '第 3 項',     placeholder: '記錄感恩的小事',       maxLength: 50 },
      { id: 'item4', label: '第 4 項',     placeholder: '散步讓腦袋放空',       maxLength: 50 },
      { id: 'item5', label: '第 5 項（選填）', placeholder: '',                  maxLength: 50 },
    ],
    hasImage: false,
    render(data, theme, size, imageUrl, texture) {
      const tx = texture && texture !== 'none' ? ` texture-${texture}` : '';
      const items = [data.item1, data.item2, data.item3, data.item4, data.item5]
        .filter(Boolean);

      const listHtml = items.length > 0
        ? items.map((item, i) =>
            `<li class="card-list-item">
              <span class="card-list-num">${i + 1}</span>
              <span>${esc(item)}</span>
            </li>`).join('')
        : `<li class="card-list-item"><span class="card-list-num">1</span><span>在左側輸入項目</span></li>`;

      return `
        <div class="card theme-${theme} size-${size}${tx}">
          <div class="card-list-title">${esc(data.title) || '清單標題'}</div>
          <ul class="card-list">${listHtml}</ul>
          ${this._watermark()}
        </div>`;
    },
  },

  'text': {
    name: '文字卡',
    fields: [
      { id: 'title',    label: '標題',   placeholder: '今日重點',                maxLength: 30 },
      { id: 'subtitle', label: '副標題', placeholder: '用一句話說你最想傳達的',   maxLength: 60 },
      { id: 'body',     label: '內文',   placeholder: '詳細說明...',             type: 'textarea', maxLength: 200 },
    ],
    hasImage: false,
    render(data, theme, size, imageUrl, texture) {
      const tx = texture && texture !== 'none' ? ` texture-${texture}` : '';
      return `
        <div class="card theme-${theme} size-${size}${tx}">
          ${data.title ? `<div class="card-pill">${esc(data.title)}</div>` : ''}
          <div class="card-text-title">${esc(data.subtitle) || '你的主標題'}</div>
          <div class="card-divider"></div>
          ${data.body ? `<div class="card-text-body">${esc(data.body).replace(/\n/g, '<br>')}</div>` : ''}
          ${this._watermark()}
        </div>`;
    },
  },
};

/* Shared watermark helper — attached at init */
function _watermarkHtml() {
  if (!window.__watermarkOn) return '';
  return '<div class="card-watermark">helloruru.com</div>';
}

/* Escape HTML */
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* Attach watermark helper to each template */
Object.values(TEMPLATES).forEach(t => { t._watermark = _watermarkHtml; });
