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

  // Debug: 在 console 顯示實際複製的內容（包括不可見字元）
  if (window.location.search.includes('debug')) {
    console.log('複製內容 (顯示不可見字元):', result.replace(/\u200B/g, '[ZWSP]').replace(/\u200C/g, '[ZWNJ]').replace(/\u2060/g, '[WJ]'))
  }

  // 4. 複製到剪貼簿
  const platformNames = { facebook: 'Facebook', instagram: 'Instagram', threads: 'Threads' }
  const platformName = platformNames[platformId] || platformId

  let success = false

  // 策略 1：Clipboard API (僅限 HTTPS 或 localhost)
  if (navigator.clipboard?.writeText && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    try {
      await navigator.clipboard.writeText(result)
      success = true
    } catch (err) {
      console.warn('Clipboard API 失敗:', err)
      // 降級到 fallback
    }
  }

  // 策略 2：execCommand fallback（iOS 相容 + http 環境）
  if (!success) {
    success = fallbackCopy(result)
  }

  if (success) {
    showToast(`已複製 — 直接到 ${platformName} 貼上`)
    return { success: true, platform: platformId }
  }

  // WebView 環境：兩種策略都失敗，顯示可選取的文字讓使用者手動複製
  showManualCopyFallback(result)
  showToast(`無法自動複製，請長按下方文字手動複製到 ${platformName}`)
  return { success: false, platform: platformId }
}

function showManualCopyFallback(text) {
  // 移除舊的 fallback
  const oldFallback = document.getElementById('manual-copy-fallback')
  if (oldFallback) {
    oldFallback.remove()
  }

  // 創建新的 fallback overlay
  const overlay = document.createElement('div')
  overlay.id = 'manual-copy-fallback'
  overlay.innerHTML = `
    <div class="manual-copy-overlay">
      <div class="manual-copy-header">
        <h3>手動複製</h3>
        <button class="manual-copy-close" aria-label="關閉">×</button>
      </div>
      <textarea class="manual-copy-text" readonly></textarea>
      <p class="manual-copy-instruction">長按上方文字，選擇「全選」然後「複製」</p>
    </div>
  `

  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `

  const textarea = overlay.querySelector('.manual-copy-text')
  textarea.value = text
  textarea.style.cssText = `
    width: 100%;
    height: 200px;
    padding: 16px;
    font-size: 16px;
    font-family: inherit;
    border: 2px solid var(--color-primary, #D4A5A5);
    border-radius: 12px;
    background: var(--color-surface, #fff);
    color: var(--color-text, #333);
    resize: none;
    margin: 16px 0;
  `

  // 樣式
  const style = document.createElement('style')
  style.textContent = `
    .manual-copy-overlay {
      background: var(--color-surface, #fff);
      border-radius: 16px;
      padding: 24px;
      max-width: 90vw;
      width: 480px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .manual-copy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .manual-copy-header h3 {
      margin: 0;
      color: var(--color-text, #333);
      font-size: 18px;
      font-weight: 500;
    }
    .manual-copy-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--color-text-muted, #888);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .manual-copy-close:hover {
      background: var(--color-border, #E8E4E1);
      border-radius: 50%;
    }
    .manual-copy-instruction {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-muted, #888);
      text-align: center;
    }
  `
  document.head.appendChild(style)

  document.body.appendChild(overlay)

  // 事件處理
  const closeBtn = overlay.querySelector('.manual-copy-close')
  const closeHandler = () => {
    overlay.remove()
    style.remove()
  }

  closeBtn.addEventListener('click', closeHandler)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeHandler()
    }
  })

  // 自動選取文字
  setTimeout(() => {
    textarea.focus()
    textarea.select()
  }, 100)
}

function cleanOutput(text) {
  let result = text.trim()
  // 保留不可見字元（ZWSP、ZWNJ、WJ），只壓縮純連續換行
  // 先把「不可見字元 + 換行」的組合暫時標記
  const PLACEHOLDER = '\x00'
  result = result.replace(/([\u200B\u200C\u2060])\n/g, PLACEHOLDER)
  result = result.replace(/\n{3,}/g, '\n\n')
  // 還原標記
  result = result.replace(new RegExp(PLACEHOLDER, 'g'), '\u200B\n')
  // 確保末尾有一個換行
  if (!result.endsWith('\n')) {
    result += '\n'
  }
  return result
}

function fallbackCopy(text) {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')

  // iOS Safari 需要元素在可見區域內才能選取
  // 不能用 pointer-events: none（會阻止焦點）
  el.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 2em;
    height: 2em;
    padding: 0;
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
    opacity: 0.01;
    font-size: 16px;
    z-index: -1000;
  `

  document.body.appendChild(el)

  // iOS Safari 焦點處理
  el.focus({ preventScroll: true })
  el.select()

  // 雙重選取確保相容性
  try {
    el.setSelectionRange(0, text.length)
  } catch {
    // 某些舊瀏覽器可能不支援
  }

  let success = false
  try {
    success = document.execCommand('copy')
  } catch (err) {
    console.warn('execCommand copy 失敗:', err)
    success = false
  }

  // 同步清理（不用 setTimeout，避免 race condition）
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
    toast.setAttribute('role', 'alert')
    toast.setAttribute('aria-live', 'polite')
    document.body.appendChild(toast)
  }

  toast.textContent = message
  toast.classList.add('toast--visible')

  clearTimeout(toast._timer)
  toast._timer = setTimeout(() => {
    toast.classList.remove('toast--visible')
  }, 2000)
}
