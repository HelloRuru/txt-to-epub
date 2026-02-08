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
  const platformName = platformNames[platformId] || platformId

  let success = false

  // 策略 1：Clipboard API
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(result)
      success = true
    } catch {
      // 降級到 fallback
    }
  }

  // 策略 2：execCommand fallback（iOS 相容）
  if (!success) {
    success = fallbackCopy(result)
  }

  if (success) {
    showToast(`已複製 — 直接到 ${platformName} 貼上`)
    return { success: true, platform: platformId }
  }

  showToast('複製失敗，請手動選取文字複製')
  return { success: false, platform: 'error' }
}

function cleanOutput(text) {
  let result = text.trim()
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.replace(/\n*$/, '\n')
  return result
}

function fallbackCopy(text) {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  // iOS Safari 會忽略螢幕外的元素，必須放在可見區域但視覺隱藏
  el.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0.01;font-size:16px'

  document.body.appendChild(el)
  el.focus()
  el.setSelectionRange(0, text.length)

  let success = false
  try {
    success = document.execCommand('copy')
  } catch {
    success = false
  }

  document.body.removeChild(el)
  return success
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
