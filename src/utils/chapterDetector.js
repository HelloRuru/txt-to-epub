/**
 * 偵測章節
 * 支援格式：
 * - 第X章、第X節、第X回
 * - Chapter X、CHAPTER X
 * - 數字編號（1.、1、①）
 * - 卷X、篇X
 */
export function detectChapters(text) {
  const patterns = [
    // 中文章節
    /^[　\s]*(第[零一二三四五六七八九十百千\d]+[章節回卷篇集部].*?)$/gm,
    // 英文章節
    /^[　\s]*(Chapter\s+\d+.*?)$/gim,
    /^[　\s]*(CHAPTER\s+\d+.*?)$/gm,
    // 數字編號
    /^[　\s]*(\d+[\.、]\s*.+?)$/gm,
    // 特殊符號編號
    /^[　\s]*([①②③④⑤⑥⑦⑧⑨⑩].+?)$/gm,
    // 卷/篇 標題
    /^[　\s]*(卷[零一二三四五六七八九十百千\d]+.*?)$/gm,
  ]

  // 合併所有匹配
  let matches = []
  for (const pattern of patterns) {
    const found = [...text.matchAll(pattern)]
    for (const match of found) {
      matches.push({
        title: match[1].trim(),
        index: match.index,
      })
    }
  }

  // 按位置排序
  matches.sort((a, b) => a.index - b.index)

  // 去除重複（同一位置可能被多個 pattern 匹配）
  matches = matches.filter((m, i, arr) => {
    if (i === 0) return true
    return Math.abs(m.index - arr[i - 1].index) > 5
  })

  // 如果沒有找到章節，回傳 null 讓 UI 處理
  if (matches.length === 0) {
    return null
  }

  // 切分內容
  const chapters = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length
    const content = text.slice(start, end).trim()

    chapters.push({
      title: matches[i].title,
      content,
    })
  }

  // 處理章節前的內容（序言等）
  if (matches.length > 0 && matches[0].index > 100) {
    const preface = text.slice(0, matches[0].index).trim()
    if (preface.length > 50) {
      chapters.unshift({
        title: '序',
        content: preface,
      })
    }
  }

  return chapters
}

/**
 * 依分隔符號分章
 * @param {string} text - 原始文字
 * @param {string} separator - 分隔符號，例如 "===" 或 "---" 或 "***"
 */
export function splitBySeparator(text, separator) {
  const parts = text.split(separator).filter(p => p.trim())
  
  if (parts.length <= 1) {
    return null
  }

  return parts.map((content, index) => ({
    title: `第 ${index + 1} 章`,
    content: content.trim(),
  }))
}

/**
 * 依空行分章（連續多個空行視為分章點）
 * @param {string} text - 原始文字
 * @param {number} minEmptyLines - 最少幾個連續空行才視為分章（預設 3）
 */
export function splitByEmptyLines(text, minEmptyLines = 3) {
  const pattern = new RegExp(`(\\n\\s*){${minEmptyLines},}`, 'g')
  const parts = text.split(pattern).filter(p => p.trim())
  
  if (parts.length <= 1) {
    return null
  }

  return parts.map((content, index) => ({
    title: `第 ${index + 1} 章`,
    content: content.trim(),
  }))
}

/**
 * 依固定字數分章
 * @param {string} text - 原始文字
 * @param {number} charsPerChapter - 每章約幾個字
 */
export function splitByCharCount(text, charsPerChapter = 5000) {
  const chapters = []
  const lines = text.split('\n')
  let currentContent = []
  let currentLength = 0
  let chapterIndex = 1

  for (const line of lines) {
    currentContent.push(line)
    currentLength += line.length

    // 到達字數門檻，且剛好在段落結尾（空行或行尾）
    if (currentLength >= charsPerChapter && line.trim() === '') {
      chapters.push({
        title: `第 ${chapterIndex} 章`,
        content: currentContent.join('\n').trim(),
      })
      currentContent = []
      currentLength = 0
      chapterIndex++
    }
  }

  // 剩餘內容
  if (currentContent.length > 0) {
    const remaining = currentContent.join('\n').trim()
    if (remaining) {
      chapters.push({
        title: `第 ${chapterIndex} 章`,
        content: remaining,
      })
    }
  }

  return chapters.length > 0 ? chapters : null
}

/**
 * 強制分為單一章節（全文）
 */
export function splitAsSingleChapter(text, title = '全文') {
  return [{
    title,
    content: text.trim(),
  }]
}
