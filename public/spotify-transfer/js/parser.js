/**
 * Song Name Parser
 * 解析使用者貼入的歌名清單 + 從 YT Music URL 抓歌
 */

// Piped API 實例（公開、CORS 友善）
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.projectsegfault.com',
];

/**
 * 從文字解析歌名清單
 * 支援格式：
 * - 歌手 - 歌名
 * - 歌名 - 歌手
 * - 歌名（只有歌名）
 * - 帶編號：1. 歌名 - 歌手
 */
export function parseText(text) {
  if (!text.trim()) return [];

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
    .map(parseLine);
}

function parseLine(raw) {
  // 移除行首編號 (1. / 1) / 01. / - )
  let cleaned = raw.replace(/^\d+[\.\)]\s*/, '').replace(/^[-•]\s*/, '').trim();

  // 嘗試用常見分隔符拆分：-, –, —, |, by
  const separators = [' - ', ' – ', ' — ', ' | ', ' by '];
  for (const sep of separators) {
    const idx = cleaned.indexOf(sep);
    if (idx > 0) {
      const left = cleaned.substring(0, idx).trim();
      const right = cleaned.substring(idx + sep.length).trim();
      // 判斷哪邊是歌手（通常較短的是歌手）
      // 但慣例是「歌手 - 歌名」或「歌名 - 歌手」都有
      return { title: right, artist: left, raw };
    }
  }

  // 沒分隔符，整行當歌名
  return { title: cleaned, artist: '', raw };
}

/**
 * 從 YouTube Music 播放清單 URL 抓歌名
 * @param {string} url - YT Music playlist URL
 * @returns {Promise<Array<{title: string, artist: string, raw: string}>>}
 */
export async function fetchFromYTMusic(url) {
  const playlistId = extractPlaylistId(url);
  if (!playlistId) {
    throw new Error('無法辨識播放清單 ID，請確認網址格式');
  }

  // 依序嘗試 Piped API 實例
  let lastError = null;
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/playlists/${playlistId}`);
      if (!res.ok) continue;

      const data = await res.json();
      if (!data.relatedStreams?.length) continue;

      return data.relatedStreams.map(stream => {
        const { title, artist } = parseVideoTitle(stream.title, stream.uploaderName);
        return { title, artist, raw: `${stream.uploaderName} - ${stream.title}` };
      });
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(
    lastError?.message || '無法從 YouTube Music 抓取歌單，請改用手動貼上歌名'
  );
}

/**
 * 從 URL 擷取 playlist ID
 */
function extractPlaylistId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('list');
  } catch {
    // 可能直接貼 playlist ID
    if (/^[A-Za-z0-9_-]+$/.test(url.trim())) return url.trim();
    return null;
  }
}

/**
 * 解析 YouTube 影片標題，拆出歌名和歌手
 * YouTube 常見格式：
 * - "歌手 - 歌名"
 * - "歌名 (Official MV)"
 * - "歌手 「歌名」"
 */
function parseVideoTitle(videoTitle, uploaderName) {
  // 清理常見後綴
  let clean = videoTitle
    .replace(/\(Official\s*(Music\s*)?Video\)/gi, '')
    .replace(/\(Official\s*MV\)/gi, '')
    .replace(/\(MV\)/gi, '')
    .replace(/\(Lyric\s*Video\)/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\(Visualizer\)/gi, '')
    .replace(/【[^】]*】/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 嘗試拆分
  const separators = [' - ', ' – ', ' — ', ' | '];
  for (const sep of separators) {
    const idx = clean.indexOf(sep);
    if (idx > 0) {
      return {
        artist: clean.substring(0, idx).trim(),
        title: clean.substring(idx + sep.length).trim(),
      };
    }
  }

  // 用 uploader name 當歌手
  const artist = uploaderName
    ?.replace(/\s*-\s*Topic$/, '')
    ?.replace(/ VEVO$/i, '')
    ?.trim() || '';

  return { title: clean, artist };
}

/**
 * 偵測輸入是 URL 還是文字
 */
export function isPlaylistUrl(input) {
  const trimmed = input.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.includes('youtube.com/playlist') ||
    trimmed.includes('music.youtube.com/')
  );
}
