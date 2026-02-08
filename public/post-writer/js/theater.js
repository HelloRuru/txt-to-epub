/**
 * 雜誌感設計排版 (Theater / Monochrome)
 *
 * Emoji → 幾何符號、欄位對齊、標題飾條、全形轉換
 */

// ─── 常數 ─────────────────────────────────────────────

const EMOJI_MAP = new Map([
  ['🔥', '✴\uFE0E'], ['⭐', '✴\uFE0E'], ['✨', '✴\uFE0E'], ['💡', '✴\uFE0E'], ['🌟', '✴\uFE0E'],
  ['✅', '■'], ['☑️', '■'], ['👍', '■'],
  ['❌', '✕'], ['🚫', '✕'], ['✖️', '✕'],
  ['➡️', '▸'], ['👉', '▸'], ['▶️', '▸'],
  ['⚠️', '◆'], ['❗', '◆'], ['‼️', '◆'],
  ['❤️', '♦'], ['💖', '♦'], ['💕', '♦'], ['😍', '♦'],
  ['📌', '▪'], ['📍', '▪'], ['📎', '▪'],
  ['🎯', '◉'], ['💪', '▪'], ['🙏', '◆'],
  ['🎉', '※'], ['🎊', '※'], ['🚀', '▲'], ['💯', '■'],
  ['⚡', '✦'], ['🏆', '◆'], ['🎁', '◇'], ['📝', '▫'], ['🔑', '◇'],
  ['💰', '◈'], ['📊', '▥'], ['🎵', '♪'], ['🎶', '♫'],
  ['😊', '○'], ['😄', '○'], ['🥰', '○'], ['😎', '◎'], ['🤔', '◇'],
  ['🔔', '◈'], ['💬', '▷'], ['📢', '◈'],
  ['👆', '▴'], ['👇', '▾'], ['👈', '◂'],
])

const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu
const CJK_BEFORE_REGEX = /(?<=[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]):/g
const CJK_BEFORE_PIPE_REGEX = /(?<=[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF])\|/g
const URL_REGEX = /https?:\/\/[^\s]+/g
const HEADING_REGEX = /^#\s*(.+)$/gm
const FIELD_LINE_REGEX = /^(.+?)(：|｜)(.*)$/
const SENTENCE_END_REGEX = /[。！？!?.，,;；…]$/

// ─── 顯示寬度計算 ─────────────────────────────────────

export function displayWidth(str) {
  let w = 0
  for (const ch of str) {
    const code = ch.codePointAt(0)
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0xF900 && code <= 0xFAFF) ||
      (code >= 0xFF01 && code <= 0xFF60) ||
      (code >= 0x3000 && code <= 0x303F) ||
      code === 0x3000
    ) {
      w += 2
    } else {
      w += 1
    }
  }
  return w
}

// ─── 標題樣式 ─────────────────────────────────────────

export const TITLE_STYLES = {
  checkerboard: (text) => `▞▞▞ ${text} ▞▞▞`,
  gradient: (text) => `░▒▓ ${text} ▓▒░`,
  box: (text) => {
    const titleWidth = displayWidth(text) + 2
    const barCount = Math.max(titleWidth, 6)
    const topBar = '▀'.repeat(barCount)
    const botBar = '▄'.repeat(barCount)
    return `▛${topBar} ${text} ${topBar}▜\n▙${botBar}${'▄'.repeat(displayWidth(text) + 2)}${botBar}▟`
  },
}

// ─── 主轉換 ───────────────────────────────────────────

export function theaterTransform(text, options = {}) {
  const {
    titleStyle = 'checkerboard',
    titleDetect = 'auto',
    fullWidthPunctuation = false,
    sentenceCase = false,
    fullWidthDigit = false,
  } = options

  // 0. URL 保護
  const urlMap = []
  let result = text.replace(URL_REGEX, (url) => {
    const placeholder = `__URL_${urlMap.length}__`
    urlMap.push(url)
    return placeholder
  })

  // 1. Emoji 替換
  result = result.replace(EMOJI_REGEX, (match) => EMOJI_MAP.get(match) || '◇')

  // 2. 符號正規化
  result = result.replace(CJK_BEFORE_REGEX, '：')
  result = result.replace(CJK_BEFORE_PIPE_REGEX, '｜')

  // 3. 欄位垂直對齊
  result = alignFields(result)

  // 4. 標題飾條
  const styleFn = TITLE_STYLES[titleStyle] || TITLE_STYLES.checkerboard

  if (titleDetect === 'manual') {
    const manualTitle = options.manualTitle?.trim()
    if (manualTitle) {
      result = styleFn(manualTitle) + '\n\n' + result
    }
  } else {
    result = result.replace(HEADING_REGEX, (_, title) => styleFn(title.trim()))

    const lines = result.split('\n')
    const processed = lines.map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('▞') || trimmed.startsWith('░') || trimmed.startsWith('▛')) return line

      const isFirstLine = i === 0 && trimmed.length <= 40
      const isShortLine = trimmed.length > 0 && trimmed.length <= 20
      const noEndPunct = !SENTENCE_END_REGEX.test(trimmed)
      const hasBlankBefore = i === 0 || !lines[i - 1]?.trim()
      const hasBlankAfter = i === lines.length - 1 || !lines[i + 1]?.trim()

      if (isFirstLine && noEndPunct) return styleFn(trimmed)
      if (isShortLine && noEndPunct && hasBlankBefore && hasBlankAfter && i > 0) return styleFn(trimmed)

      return line
    })
    result = processed.join('\n')
  }

  // 5. 標點全形
  if (fullWidthPunctuation) result = toFullWidthPunctuation(result)

  // 6. 句首大寫
  if (sentenceCase) result = toSentenceCase(result)

  // 7. 數字全形
  if (fullWidthDigit) result = toFullWidthSafe(result, { fullWidthDigit: true })

  // 8. 還原 URL
  urlMap.forEach((url, i) => {
    result = result.replace(`__URL_${i}__`, url)
  })

  return result.trim()
}

// ─── 驗證 ─────────────────────────────────────────────

export function theaterValidate(text) {
  const warnings = []
  const emojiMatches = text.match(EMOJI_REGEX) || []
  if (emojiMatches.length > 0) {
    warnings.push('偵測到彩色表情符號，將自動轉換為劇場幾何符號以維持色調一致')
  }
  if (emojiMatches.length > 10) {
    warnings.push('本文含大量 Emoji（' + emojiMatches.length + ' 個），轉換後視覺風格將大幅改變')
  }
  return { valid: true, warnings }
}

// ─── 工具函式 ─────────────────────────────────────────

function alignFields(text) {
  const lines = text.split('\n')
  const groups = []
  let currentGroup = []

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(FIELD_LINE_REGEX)
    if (match) {
      currentGroup.push({ index: i, key: match[1], sep: match[2], value: match[3] })
    } else {
      if (currentGroup.length >= 2) groups.push([...currentGroup])
      currentGroup = []
    }
  }
  if (currentGroup.length >= 2) groups.push([...currentGroup])

  for (const group of groups) {
    const maxKeyWidth = Math.max(...group.map(f => displayWidth(f.key)))
    for (const field of group) {
      const keyWidth = displayWidth(field.key)
      const padding = '\u3000'.repeat(Math.ceil((maxKeyWidth - keyWidth) / 2))
      lines[field.index] = `${field.key}${padding}${field.sep}${field.value}`
    }
  }

  return lines.join('\n')
}

const PUNCT_MAP = {
  ',': '，', '.': '。', '!': '！', '?': '？', ':': '：', ';': '；',
  '(': '（', ')': '）', '[': '［', ']': '］', '{': '｛', '}': '｝',
  '<': '＜', '>': '＞', '/': '／', '\\': '＼', '~': '～',
  '"': '＂', "'": '＇', '`': '｀', '@': '＠', '#': '＃',
  '$': '＄', '%': '％', '^': '＾', '&': '＆', '*': '＊',
  '-': '－', '_': '＿', '+': '＋', '=': '＝',
}

function toFullWidthPunctuation(text) {
  const urls = []
  let m
  const urlRegex = new RegExp(URL_REGEX.source, 'g')
  while ((m = urlRegex.exec(text)) !== null) {
    urls.push({ start: m.index, end: m.index + m[0].length })
  }

  let result = ''
  for (let i = 0; i < text.length; i++) {
    const inUrl = urls.some(u => i >= u.start && i < u.end)
    result += inUrl ? text[i] : (PUNCT_MAP[text[i]] || text[i])
  }
  return result
}

function toSentenceCase(text) {
  return text.replace(/(^|[.。!！?？\n]\s*)([a-z])/g, (_, before, letter) => {
    return before + letter.toUpperCase()
  })
}

function toFullWidthSafe(text, { fullWidthAlpha = false, fullWidthDigit = false }) {
  const urls = []
  let match
  const urlRegex = new RegExp(URL_REGEX.source, 'g')
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push({ start: match.index, end: match.index + match[0].length })
  }

  let result = ''
  for (let i = 0; i < text.length; i++) {
    const inUrl = urls.some(u => i >= u.start && i < u.end)
    if (inUrl) {
      result += text[i]
    } else {
      const code = text.charCodeAt(i)
      const isAlpha = (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A)
      const isDigit = (code >= 0x30 && code <= 0x39)
      if (fullWidthAlpha && isAlpha) result += String.fromCharCode(code + 0xFEE0)
      else if (fullWidthDigit && isDigit) result += String.fromCharCode(code + 0xFEE0)
      else result += text[i]
    }
  }
  return result
}
