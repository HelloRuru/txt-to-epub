/**
 * 平台定義 + 統計 + 模板路由
 */

import { theaterTransform, theaterValidate } from './theater.js'
import { broetryTransform, broetryValidate } from './broetry.js'

// ─── 平台定義 ─────────────────────────────────────────

export const PLATFORMS = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    maxChars: 63206,
    previewLines: 5,
    hashtagLimit: null,
    note: '超過 5 行會被折疊為「顯示更多」',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    maxChars: 2200,
    previewLines: 2,
    hashtagLimit: 30,
    note: 'Hashtag 上限 30 個',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    maxChars: 500,
    previewLines: null,
    hashtagLimit: null,
    note: '超過 500 字可拆分為串文',
  },
}

export const DEFAULT_PLATFORM = 'facebook'

// ─── 統計 ─────────────────────────────────────────────

export function computeStats(text, platformId) {
  const platform = PLATFORMS[platformId]
  if (!platform) return null

  // 用展開運算子精確計算（Emoji/多位元組字元算 1 個）
  const charCount = [...text].length
  // ZWSP 估算：每個 double-break 加 1 字元
  const breakCount = (text.match(/\n\n+/g) || []).length
  const estimatedCopyLength = charCount + breakCount
  const lineCount = text ? text.split('\n').length : 0
  const paragraphCount = text ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0
  const hashtagCount = (text.match(/#[\w\u4e00-\u9fff]+/g) || []).length

  const charPercent = Math.min((charCount / platform.maxChars) * 100, 100)

  let status = 'green'
  if (charPercent >= 90) status = 'red'
  else if (charPercent >= 70) status = 'yellow'

  let visualLines = null
  let showMoreTriggered = false
  if (platformId === 'facebook' && platform.previewLines) {
    visualLines = lineCount
    showMoreTriggered = lineCount > platform.previewLines
  }

  let hashtagOver = false
  if (platformId === 'instagram' && platform.hashtagLimit) {
    hashtagOver = hashtagCount > platform.hashtagLimit
  }

  // Threads ZWSP 超標偵測
  let threadSplits = null
  let zwspOverflow = false
  if (platformId === 'threads') {
    if (charCount > platform.maxChars) {
      threadSplits = suggestThreadSplits(text, platform.maxChars)
    } else if (estimatedCopyLength > platform.maxChars && charCount <= platform.maxChars) {
      zwspOverflow = true
    }
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
    zwspOverflow,
  }
}

function suggestThreadSplits(text, maxChars) {
  const splits = []
  let remaining = text

  while ([...remaining].length > 0) {
    if ([...remaining].length <= maxChars) {
      splits.push(remaining)
      break
    }

    // 用展開運算子精確切割位置（Emoji 等多位元組字元算 1 個）
    const chars = [...remaining]
    const chunk = chars.slice(0, maxChars).join('')

    let cutIndex = chunk.lastIndexOf('\n\n')
    if (cutIndex < maxChars * 0.3) {
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

// ─── 模板設定 ─────────────────────────────────────────

export const TEMPLATE_MODES = [
  { id: 'original', name: '原始', description: '保留原文內容，僅修復平台換行消失問題' },
  { id: 'theater', name: '雜誌感設計排版', description: '符號轉換・欄位對齊・標題飾條' },
  { id: 'broetry', name: 'Broetry 文體排版', description: '自動分段・雙換行・留白節奏' },
]

export const TITLE_STYLE_OPTIONS = [
  { id: 'checkerboard', label: '▞▞▞ 標題 ▞▞▞' },
  { id: 'gradient', label: '░▒▓ 標題 ▓▒░' },
  { id: 'box', label: '▛▀▀▀ 標題 ▀▀▀▜' },
]

export const TITLE_DETECT_OPTIONS = [
  { id: 'auto', label: '自動偵測', desc: '第一行為主標題，短句且無句末標點自動判定為段落標題' },
  { id: 'manual', label: '自行填寫', desc: '在標題欄位輸入，內文不會被自動判定為標題' },
]

// ─── 模板統一入口 ─────────────────────────────────────

export function applyTemplate(text, modeId, options = {}) {
  if (!text && !(options.titleDetect === 'manual' && options.manualTitle?.trim())) return ''
  switch (modeId) {
    case 'theater':
      return theaterTransform(text, options)
    case 'broetry':
      return broetryTransform(text, options)
    default: {
      if (options.titleDetect === 'manual' && options.manualTitle?.trim()) {
        return options.manualTitle.trim() + (text ? '\n\n' + text : '')
      }
      return text
    }
  }
}

export function validateTemplate(text, modeId) {
  if (!text) return { valid: true, warnings: [] }
  switch (modeId) {
    case 'theater':
      return theaterValidate(text)
    case 'broetry':
      return broetryValidate(text)
    default:
      return { valid: true, warnings: [] }
  }
}
