/**
 * 智慧格式轉譯器 — Tokenizer + Platform Transformer
 *
 * 流程：原始文字 → Tokenizer → Platform Transformer → 輸出
 */

// 多種不可見字元策略，提升平台相容性
const ZWSP = '\u200B'  // Zero Width Space
const ZWNJ = '\u200C'  // Zero Width Non-Joiner
const WJ = '\u2060'    // Word Joiner

// 使用組合策略，降低被平台過濾的機率
const INVISIBLE_SPACER = ZWSP

// ─── Tokenizer ─────────────────────────────────────────

/**
 * 將原始文字拆解為 token 陣列
 * token 類型：text | single-break | double-break | multi-break
 */
export function tokenize(text) {
  if (!text) return []

  const tokens = []
  const parts = text.split(/(\n+)/)

  for (const part of parts) {
    if (!part) continue
    const newlineCount = (part.match(/\n/g) || []).length

    if (newlineCount === 0) {
      tokens.push({ type: 'text', value: part })
    } else if (newlineCount === 1) {
      tokens.push({ type: 'single-break', value: '\n' })
    } else if (newlineCount === 2) {
      tokens.push({ type: 'double-break', value: '\n\n' })
    } else {
      tokens.push({ type: 'multi-break', value: part, count: newlineCount })
    }
  }

  return tokens
}

// ─── Platform Transformers ─────────────────────────────

const transformers = {
  facebook(tokens) {
    return tokens.map(t => {
      switch (t.type) {
        case 'single-break':
          return '\n'
        case 'double-break':
          // Facebook: 雙重保護策略
          return `\n${INVISIBLE_SPACER}\n`
        case 'multi-break':
          // 多個換行：每行之間插入不可見字元
          return Array(t.count - 1).fill(`\n${INVISIBLE_SPACER}`).join('') + '\n'
        default:
          return t.value
      }
    }).join('')
  },

  instagram(tokens) {
    let result = tokens.map(t => {
      switch (t.type) {
        case 'single-break':
          return '\n'
        case 'double-break':
          // Instagram: 每個空行都用不可見字元保護
          return `\n${INVISIBLE_SPACER}\n`
        case 'multi-break':
          // 多個換行：逐行保護
          return Array(t.count - 1).fill(`\n${INVISIBLE_SPACER}`).join('') + '\n'
        default:
          return t.value
      }
    }).join('')

    // IG 末尾保護：確保結尾有 \n + ZWSP 防止最後一行被吃
    if (result && result.includes('\n') && !result.endsWith(INVISIBLE_SPACER)) {
      if (!result.endsWith('\n')) {
        result += '\n'
      }
      result += INVISIBLE_SPACER
    }
    return result
  },

  threads(tokens) {
    // Threads 與 IG 類似
    return transformers.instagram(tokens)
  },
}

/**
 * 主轉換函式
 */
export function transform(text, platformId) {
  if (!text) return ''
  const tokens = tokenize(text)
  const fn = transformers[platformId]
  if (!fn) return text
  return fn(tokens)
}

/**
 * 產生預覽用 HTML（保留換行可視化）
 */
export function toPreviewHtml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>')
}
