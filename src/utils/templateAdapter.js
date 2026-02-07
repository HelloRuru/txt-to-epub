/**
 * TemplateAdapter — 專業社群排版模板邏輯
 *
 * 1. 劇場人模式 (Theater/Monochrome)
 * 2. 兄弟詩模式 (Broetry Standard)
 */

// ─── 模組層級常數 ─────────────────────────────────────

// Emoji → 黑白幾何符號（使用 Map 高效查找）
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

// Emoji 偵測（模組層級 Regex）
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu

// 中文字元判定
const CJK_BEFORE_REGEX = /(?<=[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]):/g
const CJK_BEFORE_PIPE_REGEX = /(?<=[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF])\|/g

// URL 偵測（全型轉換時跳過）
const URL_REGEX = /https?:\/\/[^\s]+/g

// 標題偵測：# 開頭 或 獨立短句 ≤20 字（前後有空行）
const HEADING_REGEX = /^#\s*(.+)$/gm

// 欄位對齊：「關鍵字＋：或｜」結構偵測
const FIELD_LINE_REGEX = /^(.+?)(：|｜)(.*)$/

// 清單前綴正規化
const LIST_PREFIX_REGEX = /^[-*・‧]\s*/

// 句末逗號（全形/半形，後方為換行、行尾或僅空白）
const TRAILING_COMMA_REGEX = /[，,]\s*(?=\n|$)/g

// 句中逗號拆行（兄弟詩模式：逗號後有內容時拆行）
const MID_COMMA_REGEX = /[，,]\s*/g

// ─── 顯示寬度計算 ─────────────────────────────────────

function displayWidth(str) {
  let w = 0
  for (const ch of str) {
    const code = ch.codePointAt(0)
    // 中文、全形符號寬度 = 2
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK 基本
      (code >= 0x3400 && code <= 0x4DBF) ||   // CJK 擴展A
      (code >= 0xF900 && code <= 0xFAFF) ||   // CJK 相容
      (code >= 0xFF01 && code <= 0xFF60) ||   // 全形ASCII
      (code >= 0x3000 && code <= 0x303F) ||   // 中文標點
      code === 0x3000                          // 全形空白
    ) {
      w += 2
    } else {
      w += 1
    }
  }
  return w
}

// ─── 劇場人模式 (Theater / Monochrome) ────────────────

const TITLE_STYLES = {
  checkerboard: (text) => `▞▞▞ ${text} ▞▞▞`,
  gradient: (text) => `░▒▓ ${text} ▓▒░`,
  box: (text) => {
    const titleWidth = displayWidth(text) + 2 // +2 for spaces
    const barCount = Math.max(titleWidth, 6)
    const topBar = '▀'.repeat(barCount)
    const botBar = '▄'.repeat(barCount)
    return `▛${topBar} ${text} ${topBar}▜\n▙${botBar}${'▄'.repeat(displayWidth(text) + 2)}${botBar}▟`
  },
}

// 句末標點（用於自動偵測：有這些結尾的不是標題）
const SENTENCE_END_REGEX = /[。！？!?.，,;；…]$/

export function theaterTransform(text, options = {}) {
  const {
    titleStyle = 'checkerboard',
    titleDetect = 'auto',
    fullWidthPunctuation = false,
    sentenceCase = false,
    fullWidthDigit = false,
  } = options

  // 0. URL 保護：用佔位符取代 URL，轉換完再還原
  const urlMap = []
  let result = text.replace(URL_REGEX, (url) => {
    const placeholder = `__URL_${urlMap.length}__`
    urlMap.push(url)
    return placeholder
  })

  // 1. Emoji 替換
  result = result.replace(EMOJI_REGEX, (match) => {
    return EMOJI_MAP.get(match) || '◇'
  })

  // 2. 符號正規化：半形 : | → 全形（前方為中文時）
  result = result.replace(CJK_BEFORE_REGEX, '：')
  result = result.replace(CJK_BEFORE_PIPE_REGEX, '｜')

  // 3. 欄位垂直對齊
  result = alignFields(result)

  // 4. 標題飾條
  const styleFn = TITLE_STYLES[titleStyle] || TITLE_STYLES.checkerboard

  if (titleDetect === 'manual') {
    // 手動模式：使用者自行填寫的標題，內文不做標題偵測
    const manualTitle = options.manualTitle?.trim()
    if (manualTitle) {
      result = styleFn(manualTitle) + '\n\n' + result
    }
  } else {
    // 自動偵測模式
    // 先處理 # 開頭
    result = result.replace(HEADING_REGEX, (_, title) => styleFn(title.trim()))

    const lines = result.split('\n')
    const processed = lines.map((line, i) => {
      const trimmed = line.trim()
      // 跳過已處理的飾條行
      if (!trimmed || trimmed.startsWith('▞') || trimmed.startsWith('░') || trimmed.startsWith('▛')) return line

      const isFirstLine = i === 0 && trimmed.length <= 40
      const isShortLine = trimmed.length > 0 && trimmed.length <= 20
      const noEndPunct = !SENTENCE_END_REGEX.test(trimmed)
      const hasBlankBefore = i === 0 || !lines[i - 1]?.trim()
      const hasBlankAfter = i === lines.length - 1 || !lines[i + 1]?.trim()

      // 第一行（≤40字）→ 主標題
      if (isFirstLine && noEndPunct) return styleFn(trimmed)
      // 短句 + 無句末標點 + 前後有空行 → 段落標題
      if (isShortLine && noEndPunct && hasBlankBefore && hasBlankAfter && i > 0) return styleFn(trimmed)

      return line
    })
    result = processed.join('\n')
  }

  // 5. 標點全形/半形轉換
  if (fullWidthPunctuation) {
    result = toFullWidthPunctuation(result)
  }

  // 6. 英文大小寫修正（句首大寫）
  if (sentenceCase) {
    result = toSentenceCase(result)
  }

  // 7. 數字全形/半形轉換（跳過 URL）
  if (fullWidthDigit) {
    result = toFullWidthSafe(result, { fullWidthAlpha: false, fullWidthDigit: true })
  }

  // 8. 還原 URL
  urlMap.forEach((url, i) => {
    result = result.replace(`__URL_${i}__`, url)
  })

  return result.trim()
}

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

function alignFields(text) {
  const lines = text.split('\n')
  const groups = []
  let currentGroup = []

  // 找出連續的「欄位行」
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(FIELD_LINE_REGEX)
    if (match) {
      currentGroup.push({ index: i, key: match[1], sep: match[2], value: match[3] })
    } else {
      if (currentGroup.length >= 2) {
        groups.push([...currentGroup])
      }
      currentGroup = []
    }
  }
  if (currentGroup.length >= 2) {
    groups.push([...currentGroup])
  }

  // 對齊每組
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

// 半形標點 → 全形標點
const PUNCT_MAP = {
  ',': '，', '.': '。', '!': '！', '?': '？', ':': '：', ';': '；',
  '(': '（', ')': '）', '[': '［', ']': '］', '{': '｛', '}': '｝',
  '<': '＜', '>': '＞', '/': '／', '\\': '＼', '~': '～',
  '"': '＂', "'": '＇', '`': '｀', '@': '＠', '#': '＃',
  '$': '＄', '%': '％', '^': '＾', '&': '＆', '*': '＊',
  '-': '－', '_': '＿', '+': '＋', '=': '＝',
}
const PUNCT_HALF_REGEX = /[,.\!?:;\(\)\[\]\{\}<>\/\\~"'`@#\$%\^&\*\-_\+=]/g

function toFullWidthPunctuation(text) {
  // 跳過 URL 內的標點
  const urls = []
  let m
  const urlRegex = new RegExp(URL_REGEX.source, 'g')
  while ((m = urlRegex.exec(text)) !== null) {
    urls.push({ start: m.index, end: m.index + m[0].length })
  }

  let result = ''
  for (let i = 0; i < text.length; i++) {
    const inUrl = urls.some(u => i >= u.start && i < u.end)
    if (inUrl) {
      result += text[i]
    } else {
      result += PUNCT_MAP[text[i]] || text[i]
    }
  }
  return result
}

// 英文句首大寫修正
function toSentenceCase(text) {
  // 在句號、問號、驚嘆號、換行之後的第一個英文字母大寫
  return text.replace(/(^|[.。!！?？\n]\s*)([a-z])/g, (_, before, letter) => {
    return before + letter.toUpperCase()
  })
}

function toFullWidthSafe(text, { fullWidthAlpha = false, fullWidthDigit = false }) {
  // 找出所有 URL 位置，跳過不轉換
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
      const isAlpha = (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A) // A-Z a-z
      const isDigit = (code >= 0x30 && code <= 0x39) // 0-9

      if (fullWidthAlpha && isAlpha) {
        result += String.fromCharCode(code + 0xFEE0)
      } else if (fullWidthDigit && isDigit) {
        result += String.fromCharCode(code + 0xFEE0)
      } else {
        result += text[i]
      }
    }
  }
  return result
}

// ─── 兄弟詩模式 (Broetry Standard) ───────────────────

export function broetryTransform(text, options = {}) {
  const { titleDetect = 'auto', manualTitle = '' } = options
  const rawLines = text.split('\n').filter(l => l.trim())
  if (rawLines.length === 0) return ''

  const result = []
  let startIndex = 0

  // 標題處理
  if (titleDetect === 'manual') {
    if (manualTitle.trim()) {
      result.push(`【 ${manualTitle.trim()} 】`)
    }
    startIndex = 0
  } else {
    // 自動：第一行當標題
    if (rawLines.length > 0) {
      const title = rawLines[0].trim().replace(/^【\s*/, '').replace(/\s*】$/, '').replace(/^\[\s*/, '').replace(/\s*\]$/, '')
      result.push(`【 ${title} 】`)
      startIndex = 1
    }
  }

  for (let i = startIndex; i < rawLines.length; i++) {
    let line = rawLines[i].trim()

    if (i === startIndex && i <= 1) {
      // 第 2 行：強制副標題
      const subtitle = line.replace(/^──\s*/, '').replace(/^—\s*/, '')
      result.push(`── ${subtitle}`)
    } else if (LIST_PREFIX_REGEX.test(line)) {
      // 清單項目：統一 •
      result.push(`• ${line.replace(LIST_PREFIX_REGEX, '')}`)
    } else if (/^#{1,3}\s/.test(line)) {
      // Markdown 標題 → 段落標題
      result.push(`▋ ${line.replace(/^#{1,3}\s*/, '')}`)
    } else {
      // 一般內容：行末標點移除（，,。），句中逗號拆行
      // 先移除行末標點
      line = line.replace(/[，,。]\s*$/, '')
      // 句中逗號拆行
      const parts = line.split(MID_COMMA_REGEX).filter(p => p.trim())
      if (parts.length > 1) {
        result.push(...parts.map(p => p.trim()))
      } else {
        result.push(line)
      }
    }
  }

  // 所有行之間雙換行
  let output = result.join('\n\n')

  // 段落標題前綴：字元數≤15、前方有空行、不以 • 開頭、不是標題/副標題
  const outputLines = output.split('\n')
  for (let i = 0; i < outputLines.length; i++) {
    const line = outputLines[i].trim()
    if (
      line.length > 0 &&
      line.length <= 15 &&
      !line.startsWith('•') &&
      !line.startsWith('▋') &&
      !line.startsWith('【') &&
      !line.startsWith('──') &&
      i > 0 && outputLines[i - 1]?.trim() === ''
    ) {
      outputLines[i] = `▋ ${line}`
    }
  }

  return outputLines.join('\n').trim()
}

export function broetryValidate(text) {
  const warnings = []
  const lines = text.split('\n').filter(l => l.trim())

  if (lines.length >= 2) {
    const subtitle = lines[1].trim().replace(/^──\s*/, '').replace(/^—\s*/, '')
    if (!/\d/.test(subtitle)) {
      warnings.push('副標題建議包含數據以增強說服力，例如：「3 個月內我學到的事」')
    }
  }

  if (lines.length < 2) {
    warnings.push('輸入不足兩行，副標題將為空字串')
  }

  // 檢查是否有連續 3 行以上無空行
  const allLines = text.split('\n')
  let consecutiveContent = 0
  for (const line of allLines) {
    if (line.trim()) {
      consecutiveContent++
      if (consecutiveContent > 3) {
        warnings.push('建議增加換行以維持留白節奏')
        break
      }
    } else {
      consecutiveContent = 0
    }
  }

  return { valid: true, warnings }
}

// ─── 統一介面 ─────────────────────────────────────────

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

/**
 * 主要 transform 入口
 */
export function applyTemplate(text, modeId, options = {}) {
  if (!text && !(options.titleDetect === 'manual' && options.manualTitle?.trim())) return ''
  switch (modeId) {
    case 'theater':
      return theaterTransform(text, options)
    case 'broetry':
      return broetryTransform(text, options)
    default: {
      // 原始模式：手動標題時在內文前加上標題
      if (options.titleDetect === 'manual' && options.manualTitle?.trim()) {
        return options.manualTitle.trim() + (text ? '\n\n' + text : '')
      }
      return text
    }
  }
}

/**
 * 主要 validate 入口
 */
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
