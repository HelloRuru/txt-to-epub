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

  // 如果沒有找到章節，整份作為一章
  if (matches.length === 0) {
    return [{
      title: '全文',
      content: text,
    }]
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
