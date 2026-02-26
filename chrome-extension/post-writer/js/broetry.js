/**
 * Broetry 文體排版 (Broetry Standard)
 *
 * 自動分段、雙換行、留白節奏、逗號拆行
 */

const LIST_PREFIX_REGEX = /^[-*・‧]\s*/
const MID_COMMA_REGEX = /[，,]\s*/g

// ─── 主轉換 ───────────────────────────────────────────

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
    if (rawLines.length > 0) {
      const title = rawLines[0].trim().replace(/^【\s*/, '').replace(/\s*】$/, '').replace(/^\[\s*/, '').replace(/\s*\]$/, '')
      result.push(`【 ${title} 】`)
      startIndex = 1
    }
  }

  for (let i = startIndex; i < rawLines.length; i++) {
    let line = rawLines[i].trim()

    if (i === startIndex && i <= 1) {
      // 副標題
      const subtitle = line.replace(/^──\s*/, '').replace(/^—\s*/, '')
      result.push(`── ${subtitle}`)
    } else if (LIST_PREFIX_REGEX.test(line)) {
      // 清單項目
      result.push(`• ${line.replace(LIST_PREFIX_REGEX, '')}`)
    } else if (/^#{1,3}\s/.test(line)) {
      // Markdown 標題 → 段落標題
      result.push(`▋ ${line.replace(/^#{1,3}\s*/, '')}`)
    } else {
      // 一般內容：行末標點移除，句中逗號拆行
      line = line.replace(/[，,。]\s*$/, '')
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

  // 段落標題前綴
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

// ─── 驗證 ─────────────────────────────────────────────

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

  // 檢查連續 3 行以上無空行
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
