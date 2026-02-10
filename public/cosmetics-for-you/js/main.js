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

/* ─── Rendering ───────────────────────────── */

let _focusTarget = null

function render() {
  const app = document.getElementById('app')
  app.innerHTML = renderApp(state)
  restoreFocus()
  announceResults()
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
  }
}

function handleInput(e) {
  state.query = e.target.value
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
  if (!state.query.trim()) return

  const { brand, colorCode, rawBrand, extraKeywords } = parseBrandAndColor(state.query)

  state.brand = brand
  state.colorCode = colorCode
  state.hasSearched = true
  state.showSuggestions = false
  state.suggestionIndex = -1
  state.results = generateSearchUrls(brand, colorCode, rawBrand, state.regionFilter, state.categoryFilter, extraKeywords)

  // 有搜尋結果時，自動打開計算機並載入匯率
  if (state.results.length > 0) {
    state.showExchangeCalc = true
    if (!state.exchangeRate) {
      fetchExchangeRate(state, render)
    }
  }

  _focusTarget = 'search'
  render()
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

/* ─── Init ────────────────────────────────── */

function init() {
  initTheme()
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
