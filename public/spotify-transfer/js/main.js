/**
 * Main Entry Point
 * 串接所有模組
 */

import { login, handleCallback, isLoggedIn, getUserProfile } from './spotify-auth.js';
import { searchTracks, createPlaylist } from './spotify-api.js';
import { parseText, fetchFromYTMusic, isPlaylistUrl } from './parser.js';
import {
  showToast, renderAuthStatus, updateSongCount,
  updateSearchButton, showProgress, hideProgress,
  renderResults, updateSelectedCount,
  showCreateResult, showCreateError, setUrlLoading,
} from './ui.js';

let searchResults = [];

// ─── Init ───────────────────────────────────────────

async function init() {
  // Handle OAuth callback
  try {
    const loggedIn = await handleCallback();
    if (loggedIn) {
      showToast('Spotify 連接成功！', 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }

  // Render auth state
  if (isLoggedIn()) {
    renderAuthStatus(getUserProfile());
    updateSearchButton(true);
  }

  // ── Event Listeners ─────────────────────────────

  // Spotify Login
  document.getElementById('btn-spotify-login').addEventListener('click', login);

  // URL Fetch
  document.getElementById('btn-fetch-url').addEventListener('click', handleUrlFetch);
  document.getElementById('url-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleUrlFetch();
  });

  // Song input change
  document.getElementById('song-input').addEventListener('input', handleInputChange);

  // Search
  document.getElementById('btn-search').addEventListener('click', handleSearch);

  // Select all checkbox
  document.getElementById('select-all').addEventListener('change', e => {
    document.querySelectorAll('.track-check:not(:disabled)').forEach(cb => {
      cb.checked = e.target.checked;
    });
    updateSelectedCount();
  });

  // Individual checkboxes (delegated)
  document.getElementById('results-body').addEventListener('change', e => {
    if (e.target.classList.contains('track-check')) {
      updateSelectedCount();
    }
  });

  // Create playlist
  document.getElementById('btn-create').addEventListener('click', handleCreate);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
      btn.classList.add('tab-btn--active');
      document.querySelectorAll('.tab-panel').forEach(p => p.hidden = true);
      document.getElementById(`tab-${tab}`).hidden = false;
    });
  });
}

// ─── Handlers ───────────────────────────────────────

async function handleUrlFetch() {
  const input = document.getElementById('url-input');
  const url = input.value.trim();
  if (!url) return;

  setUrlLoading(true);
  try {
    const songs = await fetchFromYTMusic(url);
    if (!songs.length) {
      showToast('歌單是空的，沒有找到歌曲', 'error');
      return;
    }

    // 把抓到的歌名填入文字框
    const textarea = document.getElementById('song-input');
    textarea.value = songs.map(s => s.raw).join('\n');
    handleInputChange();

    // 切到手動分頁（顯示結果）
    document.querySelector('[data-tab="manual"]').click();

    showToast(`成功抓到 ${songs.length} 首歌！`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setUrlLoading(false);
  }
}

function handleInputChange() {
  const text = document.getElementById('song-input').value;
  const songs = parseText(text);
  updateSongCount(songs.length);
  updateSearchButton(songs.length > 0 && isLoggedIn());
}

async function handleSearch() {
  if (!isLoggedIn()) {
    showToast('請先連接 Spotify', 'error');
    return;
  }

  const text = document.getElementById('song-input').value;
  const songs = parseText(text);
  if (!songs.length) {
    showToast('請先貼上歌名', 'error');
    return;
  }

  const btn = document.getElementById('btn-search');
  btn.disabled = true;
  btn.textContent = '搜尋中...';

  try {
    searchResults = await searchTracks(songs, (current, total) => {
      showProgress(current, total);
    });

    hideProgress();
    renderResults(searchResults);

    const found = searchResults.filter(r => r.result.track).length;
    showToast(`比對完成！找到 ${found}/${songs.length} 首`, 'success');
  } catch (err) {
    showToast(`搜尋失敗：${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '搜尋比對';
  }
}

async function handleCreate() {
  const name = document.getElementById('playlist-name').value.trim();
  if (!name) {
    showToast('請輸入歌單名稱', 'error');
    return;
  }

  const isPublic = document.getElementById('playlist-public').checked;

  // 收集勾選的 track URI
  const checked = document.querySelectorAll('.track-check:checked');
  const uris = [];
  checked.forEach(cb => {
    const idx = parseInt(cb.dataset.index, 10);
    const track = searchResults[idx]?.result?.track;
    if (track) uris.push(track.uri);
  });

  if (!uris.length) {
    showToast('沒有選擇任何歌曲', 'error');
    return;
  }

  const btn = document.getElementById('btn-create');
  btn.disabled = true;
  btn.textContent = '建立中...';

  try {
    const playlist = await createPlaylist(name, uris, isPublic);
    showCreateResult(playlist);
    showToast('歌單建立成功！', 'success');
  } catch (err) {
    showCreateError(err.message);
    showToast(`建立失敗：${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '建立 Spotify 歌單';
  }
}

// ─── Start ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
