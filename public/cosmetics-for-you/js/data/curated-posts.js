/**
 * curated-posts.js — 人工策劃的 Instagram 試色貼文
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 *
 * 收錄熱門色號的高品質試色照片（Instagram 貼文 URL）
 * 使用 Instagram oEmbed API 顯示縮圖，保留原作者資訊
 */

/**
 * 最後更新時間
 * 格式：YYYY-MM-DD
 */
export const lastUpdated = '2026-02-11'

export const curatedPosts = {
  // YSL 2
  'ysl-2': [
    'https://www.instagram.com/p/DRG21z7EunS/',
    'https://www.instagram.com/p/DRVFshQkn2e/'
  ],

  // YSL 3
  'ysl-3': [
    'https://www.instagram.com/p/DRG21z7EunS/'
  ],

  // YSL 1966
  'ysl-1966': [
    'https://www.instagram.com/p/DRVFshQkn2e/'
  ],

  // DIOR 077
  'dior-077': [
    'https://www.instagram.com/p/CxB6qShPnrq/'
  ],

  // DIOR 999
  'dior-999': [
    'https://www.instagram.com/p/Ci3p50hppN-/',
    'https://www.instagram.com/p/CaSuzNVPy1c/',
    'https://www.instagram.com/p/CxB6qShPnrq/'
  ],

  // MAC ruby woo
  'mac-ruby woo': [
    'https://www.instagram.com/p/CqueqAOugDG/'
  ],

  // CHANEL 197
  'chanel-197': [
    'https://www.instagram.com/p/CxnGTIzPodA/',
    'https://www.instagram.com/p/CnW9awbqspX/'
  ]
}

/**
 * 取得特定色號的 Instagram 貼文 URL
 * @param {string} brandId - 品牌 ID（小寫）
 * @param {string} colorCode - 色號（小寫）
 * @returns {string[]} Instagram 貼文 URL 陣列（最多 3 個）
 */
export function getCuratedPosts(brandId, colorCode) {
  if (!brandId || !colorCode) return []

  const key = `${brandId.toLowerCase()}-${colorCode.toLowerCase()}`
    .replace(/\s+/g, ' ')  // 統一空格
    .trim()

  return curatedPosts[key] || []
}

/**
 * 檢查是否有人工策劃的貼文
 */
export function hasCuratedPosts(brandId, colorCode) {
  return getCuratedPosts(brandId, colorCode).length > 0
}
