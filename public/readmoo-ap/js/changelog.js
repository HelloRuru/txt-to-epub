/**
 * 修改紀錄模組
 */

function getChangelog() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.CHANGELOG);
  return saved ? JSON.parse(saved) : [];
}

function saveChangelog(logs) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.CHANGELOG, JSON.stringify(logs));
}

function addChangelogEntry(type, content) {
  const logs = getChangelog();
  logs.unshift({
    id: 'log_' + Date.now(),
    time: new Date().toISOString(),
    user: AppState.user?.name || '匿名',
    type, // 'add', 'edit', 'delete'
    content
  });
  saveChangelog(logs);

  // Refresh if changelog tab is visible
  if (document.getElementById('tab-changelog').classList.contains('active')) {
    renderChangelog();
  }
}

function renderChangelog(dateFilter = '') {
  const listEl = document.getElementById('changelog-list');
  const emptyEl = document.getElementById('changelog-empty');

  let logs = getChangelog();

  if (dateFilter) {
    logs = logs.filter(l => l.time.startsWith(dateFilter));
  }

  emptyEl.style.display = logs.length === 0 ? 'block' : 'none';
  listEl.style.display = logs.length === 0 ? 'none' : 'flex';

  const typeLabels = {
    add: '新增',
    edit: '編輯',
    delete: '刪除'
  };

  listEl.innerHTML = logs.map(l => {
    const date = new Date(l.time);
    const timeStr = date.toLocaleDateString('zh-TW') + ' ' +
                    date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="log-item">
        <span class="log-time">${timeStr}</span>
        <span class="log-user">${escapeHtml(l.user)}</span>
        <span class="log-content">
          <span class="badge" style="font-size:11px;">${typeLabels[l.type] || l.type}</span>
          ${escapeHtml(l.content)}
        </span>
      </div>
    `;
  }).join('');
}

function initChangelog() {
  const dateFilter = document.getElementById('changelog-date-filter');

  dateFilter.addEventListener('change', () => {
    renderChangelog(dateFilter.value);
  });

  renderChangelog();
}

window.initChangelog = initChangelog;
window.addChangelogEntry = addChangelogEntry;
