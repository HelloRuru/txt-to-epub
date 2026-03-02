/**
 * 匯出工具模組
 * 純文字 + Excel (.xlsx)
 */

let exportContext = { type: '', selectedIds: [] };

function openExportModal(type, selectedIds) {
  exportContext = { type, selectedIds };

  const titleEl = document.getElementById('export-modal-title');
  const scopeEl = document.getElementById('export-scope');
  const previewEl = document.getElementById('export-preview');

  titleEl.textContent = type === 'directory' ? '匯出 AP 名冊' : '匯出書單';
  scopeEl.style.display = type === 'directory' ? 'flex' : 'none';
  previewEl.style.display = 'none';

  // Reset export buttons
  document.querySelectorAll('.export-btn').forEach(b => b.classList.remove('active'));

  openModal('export-modal');
}

function initExportHandlers() {
  const previewEl = document.getElementById('export-preview');
  const textEl = document.getElementById('export-text');
  const btnCopy = document.getElementById('btn-copy-export');

  // Export format buttons
  document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.export-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const format = btn.dataset.format;
      const scope = document.querySelector('input[name="export-scope"]:checked')?.value || 'all';

      if (format === 'line') {
        const text = generateLineMessage(exportContext.type, scope);
        textEl.value = text;
        previewEl.style.display = 'block';
      } else if (format === 'text') {
        const text = generateText(exportContext.type, scope);
        textEl.value = text;
        previewEl.style.display = 'block';
      } else if (format === 'excel') {
        generateExcel(exportContext.type, scope);
        previewEl.style.display = 'none';
      }
    });
  });

  // Copy button
  btnCopy.addEventListener('click', () => {
    textEl.select();
    navigator.clipboard.writeText(textEl.value).then(() => {
      showToast('已複製到剪貼簿');
    });
  });
}

function generateText(type, scope) {
  if (type === 'directory') {
    let members = AppState.members;
    if (scope === 'selected' && exportContext.selectedIds.length > 0) {
      const ids = new Set(exportContext.selectedIds);
      members = members.filter(m => ids.has(m.id));
    }

    const lines = [
      `讀墨1500日挑戰 AP 名冊`,
      `匯出日期：${new Date().toLocaleDateString('zh-TW')}`,
      `共 ${members.length} 人`,
      `─────────────────`,
      ...members.map((m, i) => `${m.id}. ${m.name} — ${m.link}`)
    ];
    return lines.join('\n');
  } else {
    const books = getBooks();
    const lines = [
      `我的書單`,
      `匯出日期：${new Date().toLocaleDateString('zh-TW')}`,
      `共 ${books.length} 本`,
      `─────────────────`,
      ...books.map(b => {
        let line = `${b.status === 'bought' ? '[已購買]' : '[想  買]'} ${b.title}`;
        if (b.author) line += ` / ${b.author}`;
        if (b.purchaseVia) line += ` (透過 ${b.purchaseVia})`;
        if (b.orderNumber) line += ` [訂單: ${b.orderNumber}]`;
        if (b.notes) line += ` — ${b.notes}`;
        return line;
      })
    ];
    return lines.join('\n');
  }
}

function generateExcel(type, scope) {
  if (typeof XLSX === 'undefined') {
    showToast('Excel 套件載入中，請稍後再試');
    return;
  }

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  let wb, filename;

  if (type === 'directory') {
    let members = AppState.members;
    if (scope === 'selected' && exportContext.selectedIds.length > 0) {
      const ids = new Set(exportContext.selectedIds);
      members = members.filter(m => ids.has(m.id));
    }

    const data = [
      ['編號', '暱稱', 'AP 連結'],
      ...members.map(m => [m.id, m.name, m.link])
    ];

    wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    // Set column widths
    ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'AP名冊');
    filename = `AP名冊_${dateStr}.xlsx`;
  } else {
    const books = getBooks();
    const data = [
      ['書名', '作者', '出版社', '出版日期', '狀態', '購買日期', 'AP 夥伴', '訂單編號', '備註'],
      ...books.map(b => [
        b.title,
        b.author || '',
        b.publisher || '',
        b.pubdate || '',
        b.status === 'bought' ? '已購買' : '想買',
        b.purchaseDate || '',
        b.purchaseVia || '',
        b.orderNumber || '',
        b.notes || ''
      ])
    ];

    wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 },
      { wch: 18 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, '我的書單');
    filename = `書單_${dateStr}.xlsx`;
  }

  XLSX.writeFile(wb, filename);
  showToast(`已下載 ${filename}`);
  closeModal('export-modal');
}

// 訂單編號遮蔽：取末 3 碼，遮第 1 碼
function maskOrderNumber(num) {
  const s = String(num).replace(/\D/g, '');
  if (s.length === 0) return '***';
  const last3 = s.slice(-3);
  return '*' + last3.slice(-2);
}

function generateLineMessage(type, scope) {
  if (type === 'directory') {
    let members = AppState.members;
    if (scope === 'selected' && exportContext.selectedIds.length > 0) {
      const ids = new Set(exportContext.selectedIds);
      members = members.filter(m => ids.has(m.id));
    }
    const lines = [
      `AP 接龍名單`,
      `${new Date().toLocaleDateString('zh-TW')}`,
      ``,
      ...members.map((m, i) => `${i + 1}. @${m.name}`),
      ``,
      `共 ${members.length} 人`
    ];
    return lines.join('\n');
  }

  // 書單 LINE 匯出：按訂單編號分組
  const books = getBooks();
  const bought = books.filter(b => b.status === 'bought');

  if (bought.length === 0) {
    return '還沒有已購買的書喔！';
  }

  // 按訂單編號分組
  const groups = {};
  const noOrder = [];

  bought.forEach(b => {
    if (b.orderNumber) {
      const key = b.orderNumber;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    } else {
      noOrder.push(b);
    }
  });

  const lines = [];

  // 有訂單編號的
  Object.keys(groups).forEach(orderNum => {
    const booksInOrder = groups[orderNum];
    const masked = maskOrderNumber(orderNum);
    const names = booksInOrder
      .map(b => b.purchaseVia ? `@${b.purchaseVia}` : '')
      .filter(Boolean);
    const uniqueNames = [...new Set(names)];
    lines.push(`訂單編號${masked} ${uniqueNames.join(' ')}`);
  });

  // 沒有訂單編號的
  if (noOrder.length > 0) {
    if (lines.length > 0) lines.push('');
    noOrder.forEach(b => {
      let line = b.title;
      if (b.purchaseVia) line += `（@${b.purchaseVia}）`;
      lines.push(line);
    });
  }

  return lines.join('\n');
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initExportHandlers();
});

window.openExportModal = openExportModal;
