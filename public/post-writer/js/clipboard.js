/**
 * 複製管線 + Toast 通知
 */

import { transform } from './converter.js'
import { applyTemplate } from './platforms.js'

// ─── 複製管線 ─────────────────────────────────────────

export async function copyResult(text, platformId, modeId = 'original', templateOptions = {}) {
  // 1. 模板轉換
  let result = applyTemplate(text, modeId, templateOptions)

  // 2. 平台換行處理
  result = transform(result, platformId)

  // 3. 清理格式
  result = cleanOutput(result)

  // 4. 複製到剪貼簿
  const platformNames = { facebook: 'Facebook', instagram: 'Instagram', threads: 'Threads' }
  try {
    await navigator.clipboard.writeText(result)
    showToast(`已複製 — 直接到 ${platformNames[platformId] || platformId} 貼上`)
    return { success: true, platform: platformId }
  } catch {
    return fallbackCopy(result, platformNames[platformId] || platformId)
  }
}

function cleanOutput(text) {
  let result = text.trim()
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.replace(/\n*$/, '\n')
  return result
}

function fallbackCopy(text, platformName) {
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
    showToast(`已複製 — 直接到 ${platformName} 貼上`)
    return { success: true, platform: 'fallback' }
  } catch {
    showToast('複製失敗，請手動選取複製')
    return { success: false, platform: 'error' }
  }
}

// ─── Toast 通知 ────────────────────────────────────────

export function showToast(message) {
  let toast = document.getElementById('copy-toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'copy-toast'
    toast.className = 'toast'
    document.body.appendChild(toast)
  }

  toast.textContent = message
  toast.classList.add('toast--visible')

  clearTimeout(toast._timer)
  toast._timer = setTimeout(() => {
    toast.classList.remove('toast--visible')
  }, 2000)
}
