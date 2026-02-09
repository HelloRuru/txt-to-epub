/**
 * 智慧格式轉譯器 — Tokenizer + Platform Transformer
 *
 * 流程：原始文字 → Tokenizer → Platform Transformer → 輸出
 */

const ZWSP = '\u200B'  // Zero Width Space

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
          return `\n${ZWSP}\n`
        case 'multi-break':
          return Array(t.count).fill(`\n${ZWSP}`).join('').slice(0, -ZWSP.length)
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
          return `\n${ZWSP}\n`
        case 'multi-break':
          return Array(t.count).fill(`\n${ZWSP}`).join('').slice(0, -ZWSP.length)
        default:
          return t.value
      }
    }).join('')

    // IG: 確保末尾有不可見字元，防止被吃
    if (result && !result.endsWith(ZWSP)) {
      result += ZWSP
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
