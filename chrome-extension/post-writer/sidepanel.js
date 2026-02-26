/**
 * Post Writer Chrome Extension — Side Panel 進入點
 *
 * 改寫自原版 main.js：
 * - 新增 Chrome messaging 監聽（platform-detected / fill-text）
 * - 移除 Quick/Editor 雙模式，Side Panel 只有單欄
 * - fetch 改用 chrome.runtime.getURL()
 * - 移除 iOS 鍵盤修正（Side Panel 不需要）
 */

import { renderApp, updateStatsBar, updatePreviewContent, updateProgressBar, updatePicker } from './js/render-panel.js'
import { PLATFORMS, TEMPLATE_MODES, computeStats, applyTemplate, validateTemplate, DEFAULT_PLATFORM } from './js/platforms.js'
import { copyResult, showToast } from './js/clipboard.js'
import { icons } from './js/icons.js'

// ─── 全域狀態 ───────────────────────────────────────────

const state = {
  text: '',
  platform: DEFAULT_PLATFORM,
  mode: 'original',
  titleStyle: 'checkerboard',
  fullWidthPunctuation: false,
  sentenceCase: false,
  fullWidthDigit: false,
  titleDetect: 'auto',
  manualTitle: '',
  previewTab: 'platform',
  previewExpanded: false,
  previewOpen: false,
  pickerTab: 'emoji',
  pickerCategory: 'smileys',
  copyState: 'idle',
  isDark: false,
  autoDetectedPlatform: null,
  hiddenPlatforms: JSON.parse(localStorage.getItem('post-writer-ext-hidden-platforms') || '[]'),
  hiddenSections: JSON.parse(localStorage.getItem('post-writer-ext-hidden-sections') || '[]'),
  hiddenModes: JSON.parse(localStorage.getItem('post-writer-ext-hidden-modes') || '[]'),
  showPlatformSettings: false,
  // Computed
  transformed: '',
  stats: null,
  validation: { valid: true, warnings: [] },
}

// ─── 資料容器 ───────────────────────────────────────────

let data = { emoji: null, symbols: null, kaomoji: null }

// ─── 載入工具 ───────────────────────────────────────────

async function loadJSON(path) {
  const url = chrome.runtime.getURL(path)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`載入 ${path} 失敗（${res.status}）`)
  try {
    return await res.json()
  } catch {
    throw new Error(`${path} 格式錯誤`)
  }
}

async function loadData() {
  const [emoji, symbols, kaomoji] = await Promise.all([
    loadJSON('data/emoji.json'),
    loadJSON('data/symbols.json'),
    loadJSON('data/kaomoji.json'),
  ])
  return { emoji, symbols, kaomoji }
}

// ─── 核心計算 ───────────────────────────────────────────

function recalculate() {
  const templateOptions = {
    titleStyle: state.titleStyle,
    titleDetect: state.titleDetect,
    manualTitle: state.manualTitle,
    fullWidthPunctuation: state.fullWidthPunctuation,
    sentenceCase: state.sentenceCase,
    fullWidthDigit: state.fullWidthDigit,
  }
  state.transformed = applyTemplate(state.text, state.mode, templateOptions)
  state.stats = computeStats(state.text, state.platform)
  state.validation = validateTemplate(state.text, state.mode)
}

// ─── 渲染 ───────────────────────────────────────────────

function render() {
  recalculate()
  const scrollY = document.documentElement.scrollTop
  const app = document.getElementById('app')
  app.innerHTML = renderApp(state, data)
  bindEvents()
  requestAnimationFrame(() => document.documentElement.scrollTo(0, scrollY))
}

function refreshPreview() {
  recalculate()
  updateStatsBar(state)
  updatePreviewContent(state)
  updateProgressBar(state)
}

// ─── Click 委派 ──────────────────────────────────────────

function handleAppClick(e) {
  const btn = e.target.closest('[data-action]')
  if (!btn) return

  const action = btn.dataset.action

  switch (action) {
    case 'set-platform':
      state.platform = btn.dataset.platform
      state.autoDetectedPlatform = null // 手動切換後清除自動偵測
      render()
      break

    case 'set-mode':
      state.mode = btn.dataset.mode
      render()
      break

    case 'set-title-detect':
      state.titleDetect = btn.dataset.detect
      render()
      break

    case 'toggle-option': {
      const opt = btn.dataset.option
      state[opt] = !state[opt]
      render()
      break
    }

    case 'set-picker-tab': {
      state.pickerTab = btn.dataset.pickerTab
      const defaults = { emoji: 'smileys', symbols: 'bullets', kaomoji: 'happy' }
      state.pickerCategory = defaults[state.pickerTab] || state.pickerCategory
      updatePicker(state, data)
      break
    }

    case 'set-picker-category':
      state.pickerCategory = btn.dataset.pickerCategory
      updatePicker(state, data)
      break

    case 'insert-item':
      insertAtCursor(btn.dataset.item)
      break

    case 'insert-separator': {
      const sep = btn.dataset.sep
      const textarea = document.getElementById('post-textarea')
      const atStart = !textarea || textarea.selectionStart === 0
      insertAtCursor(atStart ? sep + '\n' : '\n' + sep + '\n')
      break
    }

    case 'set-preview-tab':
      state.previewTab = btn.dataset.tab
      render()
      break

    case 'toggle-preview':
      state.previewOpen = !state.previewOpen
      render()
      break

    case 'toggle-expand':
      state.previewExpanded = !state.previewExpanded
      render()
      break

    case 'paste-text':
      handlePaste()
      break

    case 'clear-text':
      if (state.text || state.manualTitle) {
        state.text = ''
        state.manualTitle = ''
        state.previewExpanded = false
        render()
        showToast('已清空')
        const ta = document.getElementById('post-textarea')
        if (ta) ta.focus()
      } else {
        showToast('已經是空的')
      }
      break

    case 'copy-result':
      handleCopy()
      break

    case 'toggle-theme':
      state.isDark = !state.isDark
      document.body.classList.toggle('dark', state.isDark)
      localStorage.setItem('post-writer-ext-theme', state.isDark ? 'dark' : 'light')
      render()
      break

    case 'toggle-platform-settings':
      state.showPlatformSettings = !state.showPlatformSettings
      render()
      break

    case 'toggle-platform-visibility': {
      const pid = btn.dataset.platform
      const idx = state.hiddenPlatforms.indexOf(pid)
      if (idx >= 0) {
        state.hiddenPlatforms.splice(idx, 1)
      } else {
        state.hiddenPlatforms.push(pid)
      }
      localStorage.setItem('post-writer-ext-hidden-platforms', JSON.stringify(state.hiddenPlatforms))
      // 如果目前選中的平台被隱藏，切到第一個可見的
      if (state.hiddenPlatforms.includes(state.platform)) {
        const visible = Object.keys(PLATFORMS).filter(id => !state.hiddenPlatforms.includes(id))
        state.platform = visible[0] || DEFAULT_PLATFORM
      }
      render()
      break
    }

    case 'toggle-section-visibility': {
      const sid = btn.dataset.section
      const idx = state.hiddenSections.indexOf(sid)
      if (idx >= 0) {
        state.hiddenSections.splice(idx, 1)
      } else {
        state.hiddenSections.push(sid)
      }
      localStorage.setItem('post-writer-ext-hidden-sections', JSON.stringify(state.hiddenSections))
      render()
      break
    }

    case 'toggle-mode-visibility': {
      const mid = btn.dataset.mode
      const idx = state.hiddenModes.indexOf(mid)
      if (idx >= 0) {
        state.hiddenModes.splice(idx, 1)
      } else {
        state.hiddenModes.push(mid)
      }
      localStorage.setItem('post-writer-ext-hidden-modes', JSON.stringify(state.hiddenModes))
      // 如果目前選中的模式被隱藏，切到第一個可見的
      if (state.hiddenModes.includes(state.mode)) {
        const visibleModes = TEMPLATE_MODES.map(m => m.id).filter(id => !state.hiddenModes.includes(id))
        if (visibleModes.length > 0) {
          state.mode = visibleModes[0]
        }
      }
      render()
      break
    }
  }
}

// ─── 事件綁定 ───────────────────────────────────────────

function bindEvents() {
  const app = document.getElementById('app')

  if (!app._clickBound) {
    app.addEventListener('click', handleAppClick)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCopy()
      }
    })
    app._clickBound = true
  }

  const textarea = document.getElementById('post-textarea')
  if (textarea) {
    textarea.addEventListener('input', (e) => {
      state.text = e.target.value
      refreshPreview()
    })
    textarea.addEventListener('paste', (e) => {
      e.preventDefault()
      const plain = (e.clipboardData || window.clipboardData).getData('text/plain')
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      state.text = state.text.slice(0, start) + plain + state.text.slice(end)
      textarea.value = state.text
      const pos = start + plain.length
      textarea.selectionStart = pos
      textarea.selectionEnd = pos
      refreshPreview()
    })
    textarea.value = state.text
  }

  const titleInput = document.getElementById('manual-title-input')
  if (titleInput) {
    titleInput.addEventListener('input', (e) => {
      state.manualTitle = e.target.value
      refreshPreview()
    })
    titleInput.value = state.manualTitle
  }

  const styleSelect = document.getElementById('title-style-select')
  if (styleSelect) {
    styleSelect.addEventListener('change', (e) => {
      state.titleStyle = e.target.value
      refreshPreview()
    })
  }
}

// ─── 插入工具 ───────────────────────────────────────────

function insertAtCursor(text) {
  const textarea = document.getElementById('post-textarea')
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  state.text = state.text.slice(0, start) + text + state.text.slice(end)
  textarea.value = state.text

  requestAnimationFrame(() => {
    const pos = start + text.length
    textarea.selectionStart = pos
    textarea.selectionEnd = pos
    textarea.focus()
  })

  refreshPreview()
}

// ─── 貼上 ───────────────────────────────────────────────

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      state.text = text
      render()
    } else {
      showToast('剪貼簿是空的')
    }
  } catch {
    const textarea = document.getElementById('post-textarea')
    if (textarea) textarea.focus()
    showToast('請按 Ctrl+V 貼上')
  }
}

// ─── 複製 ───────────────────────────────────────────────

let copying = false

async function handleCopy() {
  if (copying) return
  if (!state.text && !(state.titleDetect === 'manual' && state.manualTitle.trim())) {
    showToast('請先輸入貼文內容')
    return
  }

  copying = true
  try {
    const templateOptions = {
      titleStyle: state.titleStyle,
      titleDetect: state.titleDetect,
      manualTitle: state.manualTitle,
      fullWidthPunctuation: state.fullWidthPunctuation,
      sentenceCase: state.sentenceCase,
      fullWidthDigit: state.fullWidthDigit,
    }

    const result = await copyResult(state.text, state.platform, state.mode, templateOptions)

    if (result.success) {
      state.copyState = 'success'
      render()
      setTimeout(() => {
        state.copyState = 'idle'
        const btn = document.querySelector('.copy-btn')
        if (btn) {
          btn.classList.remove('copy-btn--success')
          btn.innerHTML = icons.copy + ' 複製並套用格式'
        }
      }, 2000)
    }
  } finally {
    copying = false
  }
}

// ─── 主題 ───────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('post-writer-ext-theme')
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    state.isDark = true
    document.body.classList.add('dark')
  }
}

// ─── Chrome Messaging ───────────────────────────────────

function initMessaging() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'platform-detected') {
      state.platform = message.platform
      state.autoDetectedPlatform = message.platform
      render()
    }

    if (message.type === 'fill-text') {
      state.text = message.text
      if (message.platform) {
        state.platform = message.platform
        state.autoDetectedPlatform = message.platform
      }
      render()
      setTimeout(() => {
        const ta = document.getElementById('post-textarea')
        if (ta) ta.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  })
}

async function detectInitialPlatform() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'get-current-platform' })
    if (response?.platform) {
      state.platform = response.platform
      state.autoDetectedPlatform = response.platform
    }
  } catch {
    // 忽略
  }
}

// ─── 初始化 ─────────────────────────────────────────────

async function init() {
  console.log('[Post Writer] init 開始')
  initTheme()
  initMessaging()

  try {
    await detectInitialPlatform()
    console.log('[Post Writer] 平台偵測完成:', state.platform)
  } catch (err) {
    console.warn('[Post Writer] 平台偵測失敗（不影響使用）:', err)
  }

  try {
    data = await loadData()
    console.log('[Post Writer] 資料載入完成')
    render()
    console.log('[Post Writer] 首次渲染完成')
  } catch (err) {
    console.error('[Post Writer] 載入失敗:', err)
    const safeMsg = (err.message || '未知錯誤').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#039;'}[c]))
    document.getElementById('app').innerHTML =
      `<div style="padding:24px;text-align:center;color:var(--text-muted);">
        <p style="font-weight:700;margin-bottom:8px;">載入失敗</p>
        <p>${safeMsg}</p>
        <p style="margin-top:12px;font-size:12px;color:#888;">按 F12 查看 Console 詳細錯誤</p>
      </div>`
  }
}

document.addEventListener('DOMContentLoaded', init)
