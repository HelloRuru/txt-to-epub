/**
 * main.js — 進入點
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 *
 * Flow: init → render → bindEvents (once)
 */

// Core
import { renderApp } from './core/render.js'
import { parseBrandAndColor, generateSearchUrls, getSuggestions } from './core/search.js'

// Data
import { brands } from './data/brands.js'
import { searchNicknames } from './data/nicknames.js'

// State
import { state } from './state.js'

// Features
import { fetchExchangeRate, handleJpyInput } from './features/exchange.js'
import { shareTo, copyShareLink, copyShareText } from './features/share.js'
import { initBackToTop } from './features/back-to-top.js'
import { loadInstagramThumbnails } from './features/instagram.js'

/* ─── Utils ────────────────────────────────── */

function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/* ─── Rendering ───────────────────────────── */

let _focusTarget = null

function render() {
  try {
    // 每次渲染前更新熱門搜尋
    state.popularSearches = getTopPopularSearches(5)

    const app = document.getElementById('app')
    app.innerHTML = renderApp(state)
    restoreFocus()
    announceResults()

    // 載入 Instagram 精選貼文縮圖（如果有）
    loadInstagramThumbnails().catch(err => {
      console.warn('Failed to load Instagram thumbnails:', err)
    })
  } catch (error) {
    console.error('[render] Error:', error)
    showErrorUI('渲染頁面時發生錯誤')
  }
}

function restoreFocus() {
  if (_focusTarget === 'search') {
    const input = document.getElementById('search-input')
    if (input) {
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
    _focusTarget = null
  }
}

function announceResults() {
  const live = document.getElementById('search-live')
  if (!live) return
  if (state.hasSearched) {
    const count = state.results.length
    live.textContent = count > 0
      ? `找到 ${count} 個來源`
      : '找不到相關結果'
  } else {
    live.textContent = ''
  }
}

/* ─── Event Binding (once) ─────────────────── */

function bindEvents() {
  const app = document.getElementById('app')

  // 委派 click — 只綁一次在 #app
  app.addEventListener('click', handleClick)

  // 委派 input/keydown/focus — 只綁一次在 #app
  app.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') handleInput(e)
    if (e.target.id === 'jpy-input') handleJpyInput(e, state)
  })

  app.addEventListener('keydown', (e) => {
    if (e.target.id === 'search-input') handleKeydown(e)
  })

  app.addEventListener('focusin', (e) => {
    if (e.target.id === 'search-input') handleInputFocus()
  })

  // 點擊外部關閉自動補全 — 只綁一次在 document
  document.addEventListener('click', handleOutsideClick)

  // 全域快捷鍵 / — 聚焦搜尋框
  document.addEventListener('keydown', handleGlobalKeydown)
}

function handleClick(e) {
  const actionEl = e.target.closest('[data-action]')
  if (!actionEl) return

  const action = actionEl.dataset.action

  switch (action) {
    case 'search':
      executeSearch()
      break

    case 'filter':
      state.regionFilter = actionEl.dataset.region
      if (state.hasSearched) executeSearch()
      else render()
      break

    case 'category':
      state.categoryFilter = actionEl.dataset.category
      if (state.hasSearched) executeSearch()
      else render()
      break

    case 'select-brand': {
      const brandId = actionEl.dataset.brandId
      const brand = brands.find(b => b.id === brandId)
      if (brand) {
        state.query = brand.name_en + ' '
        state.showSuggestions = false
        state.suggestionIndex = -1
        _focusTarget = 'search'
        render()
      }
      break
    }

    case 'select-suggestion': {
      const sugType = actionEl.dataset.sugType
      if (sugType === 'nickname') {
        const nickname = actionEl.dataset.nickname
        const brandId = actionEl.dataset.brandId
        const color = actionEl.dataset.color || ''
        if (brandId) {
          const brand = brands.find(b => b.id === brandId)
          state.query = brand ? (brand.name_en + (color ? ' ' + color : ' ')) : nickname + ' '
        } else {
          state.query = nickname + ' '
        }
      } else {
        // brand suggestion
        const brandId = actionEl.dataset.brandId
        const brand = brands.find(b => b.id === brandId)
        if (brand) {
          const parsed = parseBrandAndColor(state.query)
          state.query = brand.name_en + (parsed.colorCode ? ' ' + parsed.colorCode : ' ')
        }
      }
      state.showSuggestions = false
      state.suggestionIndex = -1
      _focusTarget = 'search'
      render()
      break
    }

    case 'toggle-exchange':
      state.showExchangeCalc = !state.showExchangeCalc
      if (state.showExchangeCalc && !state.exchangeRate) {
        fetchExchangeRate(state, render)
      }
      render()
      break

    case 'toggle-share':
      state.showShareMenu = !state.showShareMenu
      render()
      break

    case 'share-line':
      shareTo('line', state, render)
      break

    case 'share-messenger':
      shareTo('messenger', state, render)
      break

    case 'copy-link':
      copyShareLink(state, render)
      break

    case 'copy-text':
      copyShareText(state, render)
      break

    case 'select-popular': {
      const query = actionEl.dataset.query
      if (query) {
        state.query = query
        state.showSuggestions = false
        state.suggestionIndex = -1
        executeSearch()
      }
      break
    }

    case 'select-history': {
      const query = actionEl.dataset.query
      if (query) {
        state.query = query
        state.showSuggestions = false
        state.suggestionIndex = -1
        _focusTarget = 'search'
        executeSearch()
      }
      break
    }

    case 'remove-history': {
      e.stopPropagation()  // 防止觸發父層的 select-history
      const query = actionEl.dataset.query
      if (query) {
        removeHistoryItem(query)
      }
      break
    }

    case 'clear-history':
      clearSearchHistory()
      break

    case 'copy-single-link': {
      const url = actionEl.dataset.url
      if (url) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('連結已複製！')
        }).catch(() => {
          showToast('複製失敗，請手動複製')
        })
      }
      break
    }
  }
}

function showToast(message) {
  // 簡單的 toast 提示
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-text);
    color: #FFFFFF;
    padding: 12px 24px;
    border-radius: 100px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: var(--shadow-lg);
    animation: fadeInOut 2s ease forwards;
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2000)
}

// 防抖版本的建議更新（300ms 延遲）
const updateSuggestionsDebounced = debounce(() => {
  const parsed = parseBrandAndColor(state.query)
  const inputText = (parsed.rawBrand || state.query).trim()

  if (inputText.length >= 1) {
    const brandSugs = getSuggestions(inputText).map(b => ({ type: 'brand', data: b }))
    const nickSugs = searchNicknames(inputText).map(n => ({ type: 'nickname', data: n }))
    state.suggestions = [...brandSugs, ...nickSugs].slice(0, 8)
    state.showSuggestions = state.suggestions.length > 0
  } else {
    state.suggestions = []
    state.showSuggestions = false
  }

  state.suggestionIndex = -1
  updateSuggestions()
}, 300)

function handleInput(e) {
  // 立即更新輸入值
  state.query = e.target.value

  // 延遲執行建議計算
  updateSuggestionsDebounced()
}

function handleKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    // 如果有選中的建議項，選擇該品牌/暱稱
    if (state.showSuggestions && state.suggestionIndex >= 0 && state.suggestionIndex < state.suggestions.length) {
      selectSuggestion(state.suggestions[state.suggestionIndex])
    } else {
      state.showSuggestions = false
      state.suggestionIndex = -1
      executeSearch()
    }
    return
  }

  if (e.key === 'Escape') {
    state.showSuggestions = false
    state.suggestionIndex = -1
    updateSuggestions()
    return
  }

  // 鍵盤導航自動補全
  if (state.showSuggestions && state.suggestions.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      state.suggestionIndex = (state.suggestionIndex + 1) % state.suggestions.length
      updateSuggestions()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      state.suggestionIndex = state.suggestionIndex <= 0
        ? state.suggestions.length - 1
        : state.suggestionIndex - 1
      updateSuggestions()
      return
    }
  }
}

function selectSuggestion(suggestion) {
  if (suggestion.type === 'nickname') {
    const n = suggestion.data
    if (n.brandId) {
      const brand = brands.find(b => b.id === n.brandId)
      state.query = brand ? (brand.name_en + (n.color ? ' ' + n.color : ' ')) : n.nickname + ' '
    } else {
      state.query = n.nickname + ' '
    }
  } else {
    const brand = suggestion.data
    const parsed = parseBrandAndColor(state.query)
    state.query = brand.name_en + (parsed.colorCode ? ' ' + parsed.colorCode : ' ')
  }
  state.showSuggestions = false
  state.suggestionIndex = -1
  _focusTarget = 'search'
  render()
}

function handleInputFocus() {
  if (state.suggestions.length > 0 && state.query.length >= 1) {
    state.showSuggestions = true
    updateSuggestions()
  }
}

function handleOutsideClick(e) {
  if (!e.target.closest('.search-box')) {
    state.showSuggestions = false
    state.suggestionIndex = -1
    updateSuggestions()
  }
}

function handleGlobalKeydown(e) {
  // 按下 / 鍵聚焦搜尋框（排除在輸入框內的情況）
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    e.preventDefault()
    const searchInput = document.getElementById('search-input')
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }
}

/* ─── 自動補全局部更新 ────────────────────── */

function updateSuggestions() {
  const box = document.querySelector('.search-box')
  if (!box) return

  const existing = box.querySelector('.search-suggestions')
  if (existing) existing.remove()

  const input = document.getElementById('search-input')

  if (!state.showSuggestions || state.suggestions.length === 0) {
    if (input) {
      input.setAttribute('aria-expanded', 'false')
      input.removeAttribute('aria-activedescendant')
    }
    return
  }

  if (input) input.setAttribute('aria-expanded', 'true')

  const ul = document.createElement('ul')
  ul.className = 'search-suggestions'
  ul.setAttribute('role', 'listbox')
  ul.id = 'search-listbox'

  for (let i = 0; i < state.suggestions.length; i++) {
    const sug = state.suggestions[i]
    const li = document.createElement('li')
    li.className = 'search-suggestions__item'
    li.id = `suggestion-${i}`
    li.setAttribute('role', 'option')
    li.setAttribute('aria-selected', i === state.suggestionIndex ? 'true' : 'false')
    li.dataset.action = 'select-suggestion'

    if (i === state.suggestionIndex) {
      li.classList.add('search-suggestions__item--active')
    }

    if (sug.type === 'brand') {
      const b = sug.data
      li.dataset.sugType = 'brand'
      li.dataset.brandId = b.id

      const nameSpan = document.createElement('span')
      nameSpan.className = 'search-suggestions__name'
      nameSpan.textContent = b.name_en

      const subSpan = document.createElement('span')
      subSpan.className = 'search-suggestions__sub'
      subSpan.textContent = b.name_zh + (b.name_ja !== b.name_en ? ' / ' + b.name_ja : '')

      li.appendChild(nameSpan)
      li.appendChild(subSpan)
    } else {
      // nickname
      const n = sug.data
      li.dataset.sugType = 'nickname'
      li.dataset.nickname = n.nickname
      if (n.brandId) li.dataset.brandId = n.brandId
      if (n.color) li.dataset.color = n.color
      li.classList.add('search-suggestions__item--nickname')

      const nameSpan = document.createElement('span')
      nameSpan.className = 'search-suggestions__name'
      nameSpan.textContent = n.nickname

      const descSpan = document.createElement('span')
      descSpan.className = 'search-suggestions__sub'
      descSpan.textContent = n.desc

      li.appendChild(nameSpan)
      li.appendChild(descSpan)
    }

    ul.appendChild(li)
  }

  box.appendChild(ul)

  // 更新 aria-activedescendant
  if (input && state.suggestionIndex >= 0) {
    input.setAttribute('aria-activedescendant', `suggestion-${state.suggestionIndex}`)
  } else if (input) {
    input.removeAttribute('aria-activedescendant')
  }
}

/* ─── 搜尋執行 ────────────────────────────── */

function executeSearch() {
  try {
    if (!state.query.trim()) return

    const { brand, colorCode, rawBrand, extraKeywords } = parseBrandAndColor(state.query)

    state.brand = brand
    state.colorCode = colorCode
    state.hasSearched = true
    state.showSuggestions = false
    state.suggestionIndex = -1
    state.results = generateSearchUrls(brand, colorCode, rawBrand, state.regionFilter, state.categoryFilter, extraKeywords)

    // 存儲搜尋歷史
    saveSearchHistory(state.query.trim())

    // 有搜尋結果時，自動打開計算機並載入匯率
    if (state.results.length > 0) {
      state.showExchangeCalc = true
      if (!state.exchangeRate) {
        fetchExchangeRate(state, render)
      }
    }

    _focusTarget = 'search'
    render()
  } catch (error) {
    console.error('[executeSearch] Error:', error)
    showErrorUI('搜尋時發生錯誤')
  }
}

/* ─── Search History Management ──────────── */

const HISTORY_STORAGE_KEY = 'cosmetics-search-history'
const MAX_HISTORY = 5

function loadSearchHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (stored) {
      state.searchHistory = JSON.parse(stored)
    }
  } catch {
    state.searchHistory = []
  }
}

function saveSearchHistory(query) {
  if (!query) return

  // 移除重複項目（不區分大小寫）
  state.searchHistory = state.searchHistory.filter(
    item => item.toLowerCase() !== query.toLowerCase()
  )

  // 插入到最前面
  state.searchHistory.unshift(query)

  // 限制最多 5 筆
  if (state.searchHistory.length > MAX_HISTORY) {
    state.searchHistory = state.searchHistory.slice(0, MAX_HISTORY)
  }

  // 存儲到 localStorage
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.searchHistory))
  } catch {
    // 忽略存儲錯誤
  }

  // 同時追蹤熱門搜尋統計
  trackPopularSearch(query)
}

function clearSearchHistory() {
  state.searchHistory = []
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  } catch {
    // 忽略
  }
  render()
}

function removeHistoryItem(query) {
  state.searchHistory = state.searchHistory.filter(item => item !== query)
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.searchHistory))
  } catch {
    // 忽略
  }
  render()
}

/* ─── Popular Searches Tracking ───────────── */

const POPULAR_STORAGE_KEY = 'cosmetics-popular-searches'
const MAX_POPULAR = 20  // 追蹤最多 20 個，顯示前 5 個

// 載入熱門搜尋統計
function loadPopularSearches() {
  try {
    const stored = localStorage.getItem(POPULAR_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// 更新搜尋次數
function trackPopularSearch(query) {
  if (!query) return

  try {
    const stats = loadPopularSearches()
    stats[query] = (stats[query] || 0) + 1

    // 只保留前 20 個最熱門的
    const sorted = Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, MAX_POPULAR)

    const trimmed = Object.fromEntries(sorted)
    localStorage.setItem(POPULAR_STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // 忽略儲存錯誤
  }
}

// 獲取 Top N 熱門搜尋
function getTopPopularSearches(n = 5) {
  const stats = loadPopularSearches()
  return Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([query, count]) => ({ query, count }))
}

/* ─── Theme Management ────────────────────── */

const STORAGE_KEY = 'cosmetics-theme'

function getPreferredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
  } catch { /* ignore */ }

  // 檢測系統偏好
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch { /* ignore */ }

  // 更新按鈕 aria-label
  const toggleBtn = document.getElementById('theme-toggle')
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-label',
      theme === 'dark' ? '切換至淺色模式' : '切換至深色模式'
    )
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

function initTheme() {
  const preferredTheme = getPreferredTheme()
  setTheme(preferredTheme)

  // 監聽系統主題變化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    } catch {
      setTheme(e.matches ? 'dark' : 'light')
    }
  })
}

function bindThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle')
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme)

    // 鍵盤支援
    toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleTheme()
      }
    })
  }
}

/* ─── URL Parameters ──────────────────────── */

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const query = params.get('q')
  const region = params.get('region')
  const category = params.get('category')

  if (region && ['tw', 'jp', 'both'].includes(region)) {
    state.regionFilter = region
  }

  if (category && ['all', 'lips', 'eye', 'face', 'nail'].includes(category)) {
    state.categoryFilter = category
  }

  if (query) {
    state.query = decodeURIComponent(query)
    return true  // 表示需要執行搜尋
  }

  return false
}

/* ─── Error Boundary ──────────────────────── */

let _errorCount = 0
const MAX_ERRORS = 3

function showErrorUI(message, details = '') {
  const app = document.getElementById('app')
  if (!app) return

  _errorCount++

  // 如果錯誤次數超過 3 次，顯示完整錯誤畫面
  if (_errorCount >= MAX_ERRORS) {
    app.innerHTML = `
      <div style="max-width: 600px; margin: 80px auto; padding: 40px; text-align: center; font-family: var(--font-main);">
        <div style="font-size: 48px; margin-bottom: 20px;">😵</div>
        <h2 style="font-size: 24px; font-weight: 700; color: var(--color-text); margin-bottom: 16px;">網站遇到錯誤</h2>
        <p style="font-size: 16px; color: var(--color-text-muted); margin-bottom: 32px; line-height: 1.6;">
          很抱歉，網站出現了一些問題。<br>
          請重新整理頁面，或稍後再試。
        </p>
        <button
          onclick="location.reload()"
          style="padding: 12px 32px; background: var(--color-primary); color: #FFFFFF; border: none; border-radius: 100px; font-size: 16px; font-weight: 500; cursor: pointer; min-height: 44px;"
        >
          重新整理頁面
        </button>
        ${details ? `<pre style="margin-top: 32px; padding: 16px; background: #F5F5F5; border-radius: 12px; font-size: 12px; text-align: left; overflow: auto; color: #666;">${details}</pre>` : ''}
      </div>
    `
    return
  }

  // 否則顯示 toast 提示
  showToast(message || '發生錯誤，請重試')
}

function setupErrorBoundary() {
  // 捕獲未處理的 JavaScript 錯誤
  window.addEventListener('error', (event) => {
    console.error('[Error Boundary] Uncaught error:', event.error)
    showErrorUI('網站遇到錯誤', event.error?.stack || event.message)
    event.preventDefault()
  })

  // 捕獲未處理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Error Boundary] Unhandled promise rejection:', event.reason)
    showErrorUI('網站遇到錯誤', event.reason?.stack || String(event.reason))
    event.preventDefault()
  })
}

/* ─── Init ────────────────────────────────── */

function init() {
  setupErrorBoundary()  // 設置全域錯誤處理
  initTheme()
  loadSearchHistory()  // 載入搜尋歷史
  render()
  bindEvents()
  bindThemeToggle()
  initBackToTop()

  // 如果 URL 有參數，自動執行搜尋
  if (parseUrlParams()) {
    executeSearch()
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
