/**
 * AP 紀錄（私人筆記）
 * 從 LINE 對話解析「誰送了 AP 給我」，存 localStorage（本機，別人看不到）
 */

const AP_LOG_KEY = 'readmoo-ap-log';
const AP_LOG_NICK_KEY = 'readmoo-ap-nick';

function initApLog() {
  const nickInput = document.getElementById('ap-log-nick-input');
  const nickSaveBtn = document.getElementById('ap-log-nick-save');
  const nickStatus = document.getElementById('ap-log-nick-status');
  const pasteSection = document.getElementById('ap-log-paste-section');
  const listSection = document.getElementById('ap-log-list-section');
  const dateInput = document.getElementById('ap-log-date');
  const textarea = document.getElementById('ap-log-textarea');
  const parseBtn = document.getElementById('ap-log-parse-btn');
  const clearBtn = document.getElementById('ap-log-clear-btn');
  const parseResult = document.getElementById('ap-log-parse-result');
  const filterSelect = document.getElementById('ap-log-filter');
  const exportBtn = document.getElementById('ap-log-export-btn');
  const listEl = document.getElementById('ap-log-list');
  const emptyEl = document.getElementById('ap-log-empty');
  const countEl = document.getElementById('ap-log-count');

  if (!nickInput) return; // 不在 ap-log tab 不啟動

  // 初始化暱稱
  const savedNick = localStorage.getItem(AP_LOG_NICK_KEY) || '';
  nickInput.value = savedNick;
  if (savedNick) {
    pasteSection.style.display = 'block';
    listSection.style.display = 'block';
    nickStatus.innerHTML = `<i data-lucide="check"></i> 已設定：「${escapeHtml(savedNick)}」`;
    if (window.lucide) lucide.createIcons();
  }

  // 預設日期 = 今天
  if (dateInput && !dateInput.value) {
    dateInput.valueAsDate = new Date();
  }

  nickSaveBtn.addEventListener('click', () => {
    const v = nickInput.value.trim();
    if (!v) {
      showToast && showToast('請輸入暱稱');
      return;
    }
    localStorage.setItem(AP_LOG_NICK_KEY, v);
    nickStatus.innerHTML = `<i data-lucide="check"></i> 已儲存：「${escapeHtml(v)}」`;
    pasteSection.style.display = 'block';
    listSection.style.display = 'block';
    if (window.lucide) lucide.createIcons();
    renderList();
  });

  parseBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) {
      showToast && showToast('請貼上 LINE 對話');
      return;
    }
    const nick = localStorage.getItem(AP_LOG_NICK_KEY);
    if (!nick) {
      showToast && showToast('請先設定暱稱');
      return;
    }
    const date = dateInput.value || new Date().toISOString().slice(0, 10);
    const parsed = parseLineConversation(text, nick);
    renderParseResult(parsed, date);
  });

  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    parseResult.innerHTML = '';
  });

  filterSelect.addEventListener('change', renderList);
  exportBtn.addEventListener('click', exportCsv);

  function renderParseResult(parsed, date) {
    if (parsed.length === 0) {
      parseResult.innerHTML = '<div class="ap-log-warn"><i data-lucide="alert-circle"></i> 沒有解析到任何送你 AP 的紀錄。檢查暱稱有沒有打對，或對話格式是否正確。</div>';
      if (window.lucide) lucide.createIcons();
      return;
    }
    const existing = getLog();
    const existingKeys = new Set(existing.map(r => `${r.from}|${r.code}`));
    const newRecords = [];
    const dupRecords = [];
    parsed.forEach(p => {
      const key = `${p.from}|${p.code}`;
      if (existingKeys.has(key)) dupRecords.push(p);
      else newRecords.push(p);
    });

    let html = '';
    if (newRecords.length > 0) {
      html += '<div class="ap-log-result-block"><strong>新紀錄（' + newRecords.length + ' 筆）：</strong><ul>';
      newRecords.forEach(r => {
        html += `<li><i data-lucide="plus-circle"></i> ${escapeHtml(r.from)} 訂單 *${escapeHtml(r.code)}</li>`;
      });
      html += '</ul>';
      html += `<button id="ap-log-confirm-btn" class="btn-primary btn-sm"><i data-lucide="check"></i> 全部登記（${newRecords.length} 筆）</button>`;
      html += '</div>';
    }
    if (dupRecords.length > 0) {
      html += '<div class="ap-log-result-block ap-log-result-dup"><strong>已存在（自動跳過 ' + dupRecords.length + ' 筆）：</strong><ul>';
      dupRecords.forEach(r => {
        html += `<li><i data-lucide="skip-forward"></i> ${escapeHtml(r.from)} 訂單 *${escapeHtml(r.code)}</li>`;
      });
      html += '</ul></div>';
    }
    parseResult.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    const confirmBtn = document.getElementById('ap-log-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const log = getLog();
        newRecords.forEach(r => {
          log.push({
            id: 'ap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            from: r.from,
            code: r.code,
            date: date,
            apPoints: '',
            note: '',
            returned: false,
            createdAt: new Date().toISOString(),
          });
        });
        saveLog(log);
        showToast && showToast(`已登記 ${newRecords.length} 筆`);
        textarea.value = '';
        parseResult.innerHTML = '';
        renderList();
      });
    }
  }

  function renderList() {
    const log = getLog();
    const filter = filterSelect.value;
    let filtered = log;
    if (filter === 'pending') filtered = log.filter(r => !r.returned);
    else if (filter === 'returned') filtered = log.filter(r => r.returned);

    // 按日期新到舊
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    countEl.textContent = filtered.length > 0 ? `共 ${filtered.length} 筆` : '';
    emptyEl.style.display = filtered.length === 0 ? 'flex' : 'none';
    listEl.style.display = filtered.length === 0 ? 'none' : 'flex';

    listEl.innerHTML = filtered.map(r => `
      <div class="ap-log-card ${r.returned ? 'returned' : ''}" data-id="${r.id}">
        <div class="ap-log-card-main">
          <div class="ap-log-card-from">${escapeHtml(r.from)}</div>
          <div class="ap-log-card-meta">
            <span class="ap-log-code">訂單 *${escapeHtml(r.code)}</span>
            <span class="ap-log-date">${escapeHtml(r.date || '')}</span>
          </div>
          <div class="ap-log-card-extra">
            <label>AP 點數：<input type="text" class="ap-log-points-input" data-id="${r.id}" value="${escapeHtml(r.apPoints || '')}" placeholder="自己填"></label>
            <label>備註：<input type="text" class="ap-log-note-input" data-id="${r.id}" value="${escapeHtml(r.note || '')}" placeholder="（選填）"></label>
          </div>
        </div>
        <div class="ap-log-card-actions">
          <label class="ap-log-returned-toggle">
            <input type="checkbox" class="ap-log-returned-check" data-id="${r.id}" ${r.returned ? 'checked' : ''}>
            <span>${r.returned ? '已回禮' : '已回禮?'}</span>
          </label>
          <button class="btn-icon ap-log-delete-btn" data-id="${r.id}" title="刪除">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
    bindListEvents();
  }

  function bindListEvents() {
    listEl.querySelectorAll('.ap-log-returned-check').forEach(cb => {
      cb.addEventListener('change', e => {
        const id = e.target.dataset.id;
        const log = getLog();
        const r = log.find(x => x.id === id);
        if (r) {
          r.returned = e.target.checked;
          saveLog(log);
          renderList();
        }
      });
    });
    listEl.querySelectorAll('.ap-log-points-input').forEach(inp => {
      inp.addEventListener('change', e => {
        const id = e.target.dataset.id;
        const log = getLog();
        const r = log.find(x => x.id === id);
        if (r) {
          r.apPoints = e.target.value.trim();
          saveLog(log);
        }
      });
    });
    listEl.querySelectorAll('.ap-log-note-input').forEach(inp => {
      inp.addEventListener('change', e => {
        const id = e.target.dataset.id;
        const log = getLog();
        const r = log.find(x => x.id === id);
        if (r) {
          r.note = e.target.value.trim();
          saveLog(log);
        }
      });
    });
    listEl.querySelectorAll('.ap-log-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!confirm('確定要刪除這筆紀錄？')) return;
        const log = getLog().filter(r => r.id !== id);
        saveLog(log);
        renderList();
      });
    });
  }

  function exportCsv() {
    const log = getLog();
    if (log.length === 0) {
      showToast && showToast('還沒有紀錄可以匯出');
      return;
    }
    const header = ['日期', '送禮人', '訂單末碼', 'AP 點數', '備註', '已回禮'];
    const rows = log.map(r => [
      r.date || '',
      r.from,
      '*' + r.code,
      r.apPoints || '',
      r.note || '',
      r.returned ? '是' : '否',
    ]);
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ap-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 初次渲染
  if (savedNick) renderList();
}

// ============ Parser ============
// 規則：
// 1. 訊息按行切，遇到「名字：」開頭視為新訊息
// 2. 每則訊息內，按 AP 區塊切（每個 AP*XX 或 *XX+*YY 算一個區塊起點）
// 3. 區塊內有 @我的暱稱 → 把區塊內所有訂單末碼登記給訊息發起人
function parseLineConversation(text, myNick) {
  const records = [];
  // 把全形冒號統一成半形，方便切名字
  const normalized = text.replace(/：/g, ':');
  const lines = normalized.split('\n');

  // 把對話切成「訊息群組」（每個訊息有一個發起人）
  const messages = [];
  let current = null;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // 偵測「名字: 內容」格式（名字不含 @ 不含空格冒號）
    const m = line.match(/^([^:@\s][^:]{0,20}?):\s*(.*)$/);
    if (m) {
      if (current) messages.push(current);
      current = { from: m[1].trim(), body: m[2] };
    } else if (current) {
      current.body += '\n' + line;
    }
  }
  if (current) messages.push(current);

  for (const msg of messages) {
    const fromName = msg.from;
    if (!fromName || fromName === myNick) continue; // 跳過自己發的

    // 找所有訂單末碼位置（[*#＊＃] 後接 1-6 位數字）
    // 也支援「*17+*68」這種多筆組合
    const codeRegex = /[*#＊＃]\s*(\d{1,6})/g;
    const codeMatches = [];
    let cm;
    while ((cm = codeRegex.exec(msg.body)) !== null) {
      codeMatches.push({ code: cm[1], pos: cm.index });
    }
    if (codeMatches.length === 0) continue;

    // 按區塊分組：相鄰（中間沒有 @ 段落）的訂單末碼算同一區塊
    // 簡化策略：把訊息按「AP 出現位置」切段，每段內的所有 codes + @ 名單算一組
    // 更穩健：把 message body 用空行或 AP 關鍵字斷成區塊
    const blocks = splitIntoBlocks(msg.body);
    for (const block of blocks) {
      // 區塊內的訂單末碼
      const codes = [];
      let bm;
      const re = /[*#＊＃]\s*(\d{1,6})/g;
      while ((bm = re.exec(block)) !== null) codes.push(bm[1]);
      if (codes.length === 0) continue;

      // 區塊內的 @ 名單
      const mentions = extractMentions(block);
      const meMentioned = mentions.some(m => m === myNick || m.includes(myNick) || myNick.includes(m));
      if (!meMentioned) continue;

      // 登記每個 code
      for (const code of codes) {
        records.push({ from: fromName, code });
      }
    }
  }

  // 同訊息內去重（避免一個區塊有兩個一樣的 *68）
  const seen = new Set();
  return records.filter(r => {
    const k = `${r.from}|${r.code}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 把訊息內文切成「區塊」
// 規則：以「空行」或「AP*XX 出現」當區塊分界
function splitIntoBlocks(body) {
  // 先按連續空行切
  const paragraphs = body.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);
  // 如果沒空行（只有一段），整則就是一個區塊
  if (paragraphs.length <= 1) return [body];
  return paragraphs;
}

// 抽取 @ 名單（支援中英數、底線、括號內字符、Emoji）
function extractMentions(text) {
  const mentions = [];
  // @ 後抓到下一個 @ 之前 / 換行 / 字串結尾
  const re = /@([^@\n]+?)(?=\s*@|\s*$|\n)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1].trim();
    // 跳過 +1, +2 這種
    if (/^\+\d+$/.test(raw)) continue;
    if (raw.length === 0) continue;
    mentions.push(raw);
  }
  return mentions;
}

// ============ 工具 ============
function getLog() {
  try {
    return JSON.parse(localStorage.getItem(AP_LOG_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveLog(log) {
  localStorage.setItem(AP_LOG_KEY, JSON.stringify(log));
}

// 載入時初始化（等 DOM ready）
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ap-log-nick-input')) {
    initApLog();
  }
});

window.initApLog = initApLog;
