/**
 * main.js — 進入點
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 *
 * Flow: init → render → bindEvents (once)
 */

import { renderApp } from './render.js'
import { parseBrandAndColor, generateSearchUrls, getSuggestions } from './search.js'
import { brands } from './brands.js'

/* ─── State ───────────────────────────────── */

const state = {
  query: '',
  brand: null,
  colorCode: '',
  regionFilter: 'all',
  results: [],
  suggestions: [],
  showSuggestions: false,
  hasSearched: false,
  suggestionIndex: -1,
}

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
      const brandId = actionEl.dataset.brandId
      const brand = brands.find(b => b.id === brandId)
      if (brand) {
        const parsed = parseBrandAndColor(state.query)
        state.query = brand.name_en + (parsed.colorCode ? ' ' + parsed.colorCode : ' ')
        state.showSuggestions = false
        state.suggestionIndex = -1
        _focusTarget = 'search'
        render()
      }
      break
    }
  }
}

function handleInput(e) {
  state.query = e.target.value
  const parsed = parseBrandAndColor(state.query)

  if (parsed.rawBrand && parsed.rawBrand.length >= 1) {
    state.suggestions = getSuggestions(parsed.rawBrand)
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
    // 如果有選中的建議項，選擇該品牌
    if (state.showSuggestions && state.suggestionIndex >= 0 && state.suggestionIndex < state.suggestions.length) {
      const brand = state.suggestions[state.suggestionIndex]
      const parsed = parseBrandAndColor(state.query)
      state.query = brand.name_en + (parsed.colorCode ? ' ' + parsed.colorCode : ' ')
      state.showSuggestions = false
      state.suggestionIndex = -1
      _focusTarget = 'search'
      render()
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
    const b = state.suggestions[i]
    const li = document.createElement('li')
    li.className = 'search-suggestions__item'
    li.id = `suggestion-${i}`
    li.setAttribute('role', 'option')
    li.setAttribute('aria-selected', i === state.suggestionIndex ? 'true' : 'false')
    li.dataset.action = 'select-suggestion'
    li.dataset.brandId = b.id

    if (i === state.suggestionIndex) {
      li.classList.add('search-suggestions__item--active')
    }

    const nameSpan = document.createElement('span')
    nameSpan.className = 'search-suggestions__name'
    nameSpan.textContent = b.name_en

    const subSpan = document.createElement('span')
    subSpan.className = 'search-suggestions__sub'
    subSpan.textContent = b.name_zh + (b.name_ja !== b.name_en ? ' / ' + b.name_ja : '')

    li.appendChild(nameSpan)
    li.appendChild(subSpan)
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

  const { brand, colorCode, rawBrand } = parseBrandAndColor(state.query)

  state.brand = brand
  state.colorCode = colorCode
  state.hasSearched = true
  state.showSuggestions = false
  state.suggestionIndex = -1
  state.results = generateSearchUrls(brand, colorCode, rawBrand, state.regionFilter)

  _focusTarget = 'search'
  render()
}

/* ─── Init ────────────────────────────────── */

function init() {
  render()
  bindEvents()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
