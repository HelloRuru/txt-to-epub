/**
 * instagram.js — Instagram oEmbed 縮圖載入
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 */

/**
 * 使用 Instagram oEmbed API 載入貼文縮圖
 * @param {string} postUrl - Instagram 貼文 URL
 * @returns {Promise<Object>} oEmbed 資料 { thumbnail_url, author_name, ... }
 */
export async function fetchInstagramOEmbed(postUrl) {
  try {
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(postUrl)}`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      throw new Error(`oEmbed API failed: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.warn('Failed to fetch Instagram oEmbed:', error)
    return null
  }
}

/**
 * 載入所有策展貼文的縮圖並渲染到頁面
 * 在 DOM 載入後調用，透過 data-url 屬性找到每個 placeholder
 */
export async function loadInstagramThumbnails() {
  const grid = document.getElementById('ig-curated-grid')
  if (!grid) return

  const posts = grid.querySelectorAll('.ig-curated-card__post')

  for (const post of posts) {
    const url = post.dataset.url
    if (!url) continue

    const oembed = await fetchInstagramOEmbed(url)

    if (oembed && oembed.thumbnail_url) {
      const placeholder = post.querySelector('.ig-curated-card__placeholder')
      if (placeholder) {
        placeholder.innerHTML = `
          <img
            src="${oembed.thumbnail_url}"
            alt="${oembed.author_name || 'Instagram 試色'}"
            class="ig-curated-card__img"
            loading="lazy"
          >
        `
      }
    } else {
      // oEmbed 失敗，顯示 fallback
      const placeholder = post.querySelector('.ig-curated-card__placeholder')
      if (placeholder) {
        placeholder.innerHTML = '<div class="ig-curated-card__error">載入失敗</div>'
      }
    }
  }
}
