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
  // YSL 416 爛番茄色
  'ysl-416': [
    'https://www.instagram.com/p/C_abc123/',  // 示例 URL（需替換為真實貼文）
    'https://www.instagram.com/p/C_def456/',
    'https://www.instagram.com/p/C_ghi789/'
  ],

  // Dior 999 經典正紅
  'dior-999': [
    'https://www.instagram.com/p/C_jkl012/',
    'https://www.instagram.com/p/C_mno345/',
    'https://www.instagram.com/p/C_pqr678/'
  ],

  // MAC Ruby Woo
  'mac-ruby woo': [
    'https://www.instagram.com/p/C_stu901/',
    'https://www.instagram.com/p/C_vwx234/',
    'https://www.instagram.com/p/C_yza567/'
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
