/**
 * Spotify API Module
 * 搜尋曲目 + 建立歌單
 */

import { getToken } from './spotify-auth.js';

const API_BASE = 'https://api.spotify.com/v1';

async function apiFetch(url, options = {}) {
  const token = getToken();
  if (!token) throw new Error('尚未登入 Spotify');

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '3', 10);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return apiFetch(url, options);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API 錯誤 ${res.status}`);
  }

  return res.json();
}

/**
 * 搜尋單首歌
 * @param {string} query - 歌名 + 歌手
 * @returns {{ track: object|null, candidates: object[] }}
 */
export async function searchTrack(query) {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: '5',
    market: 'TW',
  });

  const data = await apiFetch(`${API_BASE}/search?${params}`);
  const items = data.tracks?.items || [];

  return {
    track: items[0] || null,
    candidates: items,
  };
}

/**
 * 批次搜尋多首歌，附進度回呼
 * @param {Array<{title: string, artist: string, raw: string}>} songs
 * @param {function} onProgress - (current, total) => void
 * @returns {Array<{song: object, result: {track: object|null, candidates: object[]}}>}
 */
export async function searchTracks(songs, onProgress) {
  const results = [];

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const query = song.artist
      ? `${song.title} ${song.artist}`
      : song.title;

    try {
      const result = await searchTrack(query);
      results.push({ song, result });
    } catch (err) {
      results.push({ song, result: { track: null, candidates: [] }, error: err.message });
    }

    onProgress?.(i + 1, songs.length);

    // Throttle: 200ms between requests to stay under rate limit
    if (i < songs.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return results;
}

/**
 * 建立歌單並加入曲目
 * @param {string} name - 歌單名稱
 * @param {string[]} trackUris - Spotify track URIs
 * @param {boolean} isPublic
 * @returns {object} - 新建的 playlist 資料
 */
export async function createPlaylist(name, trackUris, isPublic = false) {
  // 用 /me/playlists（2026/02 新端點）
  const playlist = await apiFetch(`${API_BASE}/me/playlists`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: '透過 HelloRuru YT→Spotify 歌單轉換工具建立',
      public: isPublic,
    }),
  });

  // 每 100 首一批加入
  for (let i = 0; i < trackUris.length; i += 100) {
    const batch = trackUris.slice(i, i + 100);
    await apiFetch(`${API_BASE}/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: batch }),
    });
  }

  return playlist;
}
