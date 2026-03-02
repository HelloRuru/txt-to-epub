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

      if (format === 'text') {
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
      ['書名', '作者', '版本', '出版日期', '狀態', '購買日期', 'AP 夥伴'],
      ...books.map(b => [
        b.title,
        b.author || '',
        b.version || '',
        b.pubdate || '',
        b.status === 'bought' ? '已購買' : '想買',
        b.purchaseDate || '',
        b.purchaseVia || ''
      ])
    ];

    wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 10 },
      { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, '我的書單');
    filename = `書單_${dateStr}.xlsx`;
  }

  XLSX.writeFile(wb, filename);
  showToast(`已下載 ${filename}`);
  closeModal('export-modal');
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initExportHandlers();
});

window.openExportModal = openExportModal;
