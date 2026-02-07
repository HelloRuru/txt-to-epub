/**
 * 非同步剪貼簿 + 平台格式化裝飾器
 *
 * 複製前執行：trim() → 連續 3+ 換行壓縮為 2 個 → 結尾恰好 1 個 \n
 */

import { transform } from './postConverter'
import { applyTemplate } from './templateAdapter'

/**
 * copyDecorator：完整複製管線
 * 1. 套用模板轉換
 * 2. 套用平台換行處理
 * 3. 清理格式
 * 4. 複製到剪貼簿
 */
export async function copyDecorator(text, platformId, modeId = 'original', templateOptions = {}) {
  // 1. 模板轉換
  let result = applyTemplate(text, modeId, templateOptions)

  // 2. 平台換行處理
  result = transform(result, platformId)

  // 3. 清理格式
  result = cleanOutput(result)

  // 4. 複製
  try {
    await navigator.clipboard.writeText(result)
    return { success: true, platform: platformId }
  } catch {
    return fallbackCopy(result)
  }
}

/**
 * 清理輸出文字
 * - trim()
 * - 連續 3+ 換行壓縮為 2 個
 * - 結尾恰好 1 個 \n
 */
function cleanOutput(text) {
  let result = text.trim()
  // 連續 3+ 換行 → 2 個
  result = result.replace(/\n{3,}/g, '\n\n')
  // 結尾恰好 1 個 \n
  result = result.replace(/\n*$/, '\n')
  return result
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return { success: true, platform: 'fallback' }
  } catch {
    return { success: false, platform: 'error' }
  }
}
