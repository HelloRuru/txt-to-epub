/**
 * 複製管線 + Toast 通知（Chrome Extension 版）
 *
 * 與原版差異：
 * - copyResult 移除 protocol 檢查（extension 頁面永遠可用 Clipboard API）
 * - showManualCopyFallback overlay 適配窄面板
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

  // Chrome Extension Side Panel 可以直接用 Clipboard API
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(result)
      success = true
    } catch (err) {
      console.warn('Clipboard API 失敗:', err)
    }
  }

  // 降級策略：execCommand
  if (!success) {
    success = fallbackCopy(result)
  }

  if (success) {
    showToast(`已複製 — 直接到 ${platformName} 貼上`)
    return { success: true, platform: platformId }
  }

  // 兩種策略都失敗：手動複製
  showManualCopyFallback(result)
  showToast(`無法自動複製，請手動複製到 ${platformName}`)
  return { success: false, platform: platformId }
}

function showManualCopyFallback(text) {
  const oldFallback = document.getElementById('manual-copy-fallback')
  if (oldFallback) oldFallback.remove()

  const overlay = document.createElement('div')
  overlay.id = 'manual-copy-fallback'
  overlay.innerHTML = `
    <div class="manual-copy-overlay">
      <div class="manual-copy-header">
        <h3>手動複製</h3>
        <button class="manual-copy-close" aria-label="關閉">\u00d7</button>
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
    padding: 12px;
  `

  const textarea = overlay.querySelector('.manual-copy-text')
  textarea.value = text
  textarea.style.cssText = `
    width: 100%;
    height: 180px;
    padding: 12px;
    font-size: 14px;
    font-family: inherit;
    border: 2px solid var(--accent-primary, #D4A5A5);
    border-radius: 12px;
    background: var(--bg-card, #fff);
    color: var(--text-primary, #333);
    resize: none;
    margin: 12px 0;
  `

  const style = document.createElement('style')
  style.textContent = `
    .manual-copy-overlay {
      background: var(--bg-card, #fff);
      border-radius: 16px;
      padding: 16px;
      width: 100%;
      max-width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .manual-copy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .manual-copy-header h3 {
      margin: 0;
      color: var(--text-primary, #333);
      font-size: 16px;
      font-weight: 500;
    }
    .manual-copy-close {
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: var(--text-muted, #888);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .manual-copy-close:hover {
      background: var(--bg-secondary, #E8E4E1);
    }
    .manual-copy-instruction {
      margin: 0;
      font-size: 13px;
      color: var(--text-muted, #888);
      text-align: center;
    }
  `
  document.head.appendChild(style)
  document.body.appendChild(overlay)

  const closeHandler = () => {
    overlay.remove()
    style.remove()
  }

  overlay.querySelector('.manual-copy-close').addEventListener('click', closeHandler)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeHandler()
  })

  setTimeout(() => {
    textarea.focus()
    textarea.select()
  }, 100)
}

function cleanOutput(text) {
  let result = text.trim()
  const PLACEHOLDER = '\x00'
  result = result.replace(/([\u200B\u200C\u2060])\n/g, PLACEHOLDER)
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.replace(new RegExp(PLACEHOLDER, 'g'), '\u200B\n')
  if (!result.endsWith('\n')) {
    result += '\n'
  }
  return result
}

function fallbackCopy(text) {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
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
  el.focus({ preventScroll: true })
  el.select()

  try {
    el.setSelectionRange(0, text.length)
  } catch {
    // 某些環境不支援
  }

  let success = false
  try {
    success = document.execCommand('copy')
  } catch (err) {
    console.warn('execCommand copy 失敗:', err)
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
