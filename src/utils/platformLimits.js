/**
 * 各社群平台邊界條件定義
 */

export const PLATFORMS = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'fb',
    maxChars: 63206,
    previewLines: 5,       // 「顯示更多」前的可見行數
    hashtagLimit: null,
    note: '超過 5 行會被折疊為「顯示更多」',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: 'ig',
    maxChars: 2200,
    previewLines: 2,       // caption 預覽行數
    hashtagLimit: 30,
    note: 'Hashtag 上限 30 個',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    icon: 'threads',
    maxChars: 500,
    previewLines: null,
    hashtagLimit: null,
    note: '超過 500 字可拆分為串文',
  },
}

export const DEFAULT_PLATFORM = 'facebook'

/**
 * 計算文字統計數據
 */
export function computeStats(text, platformId) {
  const platform = PLATFORMS[platformId]
  if (!platform) return null

  const charCount = text.length
  const lineCount = text ? text.split('\n').length : 0
  const paragraphCount = text ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0
  const hashtagCount = (text.match(/#[\w\u4e00-\u9fff]+/g) || []).length

  // 字數進度百分比
  const charPercent = Math.min((charCount / platform.maxChars) * 100, 100)

  // 狀態：green / yellow / red
  let status = 'green'
  if (charPercent >= 90) status = 'red'
  else if (charPercent >= 70) status = 'yellow'

  // FB: 視覺行數追蹤
  let visualLines = null
  let showMoreTriggered = false
  if (platformId === 'facebook' && platform.previewLines) {
    visualLines = lineCount
    showMoreTriggered = lineCount > platform.previewLines
  }

  // IG: Hashtag 檢查
  let hashtagOver = false
  if (platformId === 'instagram' && platform.hashtagLimit) {
    hashtagOver = hashtagCount > platform.hashtagLimit
  }

  // Threads: 串文拆分建議
  let threadSplits = null
  if (platformId === 'threads' && charCount > platform.maxChars) {
    threadSplits = suggestThreadSplits(text, platform.maxChars)
  }

  return {
    charCount,
    lineCount,
    paragraphCount,
    hashtagCount,
    charPercent,
    status,
    maxChars: platform.maxChars,
    visualLines,
    showMoreTriggered,
    hashtagOver,
    hashtagLimit: platform.hashtagLimit,
    threadSplits,
  }
}

/**
 * Threads 串文自動拆分建議
 * 優先按段落 → 句號 → 字數硬切
 */
function suggestThreadSplits(text, maxChars) {
  const splits = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      splits.push(remaining)
      break
    }

    // 在 maxChars 範圍內找最佳切點
    const chunk = remaining.slice(0, maxChars)

    // 優先找段落分隔
    let cutIndex = chunk.lastIndexOf('\n\n')
    if (cutIndex < maxChars * 0.3) {
      // 找句號
      const sentenceEnd = Math.max(
        chunk.lastIndexOf('。'),
        chunk.lastIndexOf('！'),
        chunk.lastIndexOf('？'),
        chunk.lastIndexOf('. '),
      )
      cutIndex = sentenceEnd > maxChars * 0.3 ? sentenceEnd + 1 : maxChars
    } else {
      cutIndex += 1
    }

    splits.push(remaining.slice(0, cutIndex).trim())
    remaining = remaining.slice(cutIndex).trim()
  }

  return splits
}
