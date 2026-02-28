/**
 * UI Rendering Module
 */

// ─── Toast Notification ─────────────────────────────

export function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--show`;
  setTimeout(() => toast.classList.remove('toast--show'), 3000);
}

// ─── Auth Status ────────────────────────────────────

export function renderAuthStatus(user) {
  const el = document.getElementById('auth-status');
  const btn = document.getElementById('btn-spotify-login');

  if (user) {
    el.innerHTML = `
      <span class="auth-status auth-status--ok">
        ✓ 已連接：${escapeHtml(user.display_name || user.id)}
      </span>`;
    btn.textContent = '已連接';
    btn.disabled = true;
    btn.classList.add('btn--connected');
  } else {
    el.innerHTML = '';
    btn.textContent = '連接 Spotify';
    btn.disabled = false;
    btn.classList.remove('btn--connected');
  }
}

// ─── Song Count ─────────────────────────────────────

export function updateSongCount(count) {
  document.getElementById('song-count').textContent = `${count} 首歌`;
}

// ─── Search Button State ────────────────────────────

export function updateSearchButton(enabled) {
  document.getElementById('btn-search').disabled = !enabled;
}

// ─── Progress ───────────────────────────────────────

export function showProgress(current, total) {
  const el = document.getElementById('search-progress');
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');

  el.hidden = false;
  const pct = Math.round((current / total) * 100);
  fill.style.width = `${pct}%`;
  text.textContent = `搜尋中... ${current}/${total}`;
}

export function hideProgress() {
  document.getElementById('search-progress').hidden = true;
}

// ─── Results Table ──────────────────────────────────

export function renderResults(results) {
  const section = document.getElementById('step-results');
  const body = document.getElementById('results-body');
  const summary = document.getElementById('results-summary');

  section.hidden = false;

  const found = results.filter(r => r.result.track);
  const notFound = results.filter(r => !r.result.track);

  summary.innerHTML = `
    <span class="badge badge--ok">找到 ${found.length} 首</span>
    ${notFound.length ? `<span class="badge badge--warn">未找到 ${notFound.length} 首</span>` : ''}
  `;

  body.innerHTML = results.map((r, i) => {
    const track = r.result.track;
    const statusClass = track ? 'status--ok' : 'status--miss';
    const statusText = track ? '✓' : '✗';
    const matchInfo = track
      ? `${escapeHtml(track.artists.map(a => a.name).join(', '))} — ${escapeHtml(track.name)}`
      : '<span class="text-muted">找不到對應歌曲</span>';

    return `
      <tr data-index="${i}">
        <td class="results-table__check">
          <input type="checkbox" class="track-check" data-index="${i}" ${track ? 'checked' : ''} ${track ? '' : 'disabled'}>
        </td>
        <td class="results-table__original">${escapeHtml(r.song.raw)}</td>
        <td class="results-table__match">${matchInfo}</td>
        <td class="results-table__status"><span class="${statusClass}">${statusText}</span></td>
      </tr>`;
  }).join('');

  // Show create section
  document.getElementById('step-create').hidden = false;
  updateSelectedCount();
}

// ─── Selected Count ─────────────────────────────────

export function updateSelectedCount() {
  const checks = document.querySelectorAll('.track-check:checked');
  const countEl = document.getElementById('selected-count');
  const btn = document.getElementById('btn-create');

  countEl.textContent = `已選 ${checks.length} 首`;
  btn.disabled = checks.length === 0;
}

// ─── Create Result ──────────────────────────────────

export function showCreateResult(playlist) {
  const el = document.getElementById('create-result');
  el.hidden = false;
  el.innerHTML = `
    <div class="create-success">
      <span class="create-success__icon">🎉</span>
      <p>歌單建立成功！</p>
      <a href="${playlist.external_urls.spotify}" target="_blank" rel="noopener" class="btn btn--spotify btn--sm">
        在 Spotify 開啟「${escapeHtml(playlist.name)}」
      </a>
    </div>`;
}

export function showCreateError(message) {
  const el = document.getElementById('create-result');
  el.hidden = false;
  el.innerHTML = `
    <div class="create-error">
      <p>建立失敗：${escapeHtml(message)}</p>
    </div>`;
}

// ─── Loading State for URL Fetch ────────────────────

export function setUrlLoading(loading) {
  const btn = document.getElementById('btn-fetch-url');
  const input = document.getElementById('url-input');
  if (loading) {
    btn.disabled = true;
    btn.textContent = '抓取中...';
    input.disabled = true;
  } else {
    btn.disabled = false;
    btn.textContent = '抓取歌名';
    input.disabled = false;
  }
}

// ─── Helpers ────────────────────────────────────────

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
