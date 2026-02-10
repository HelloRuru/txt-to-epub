/**
 * render.js — UI 渲染
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 */

import { icons, tierIcons } from './icons.js'
import { tierMeta } from './sources.js'
import { brands } from './brands.js'

const defaultTierMeta = { label: '其他', color: '#888888' }

/* ─── 主渲染 ─────────────────────────────── */

export function renderApp(state) {
  return `
    <div aria-live="polite" id="search-live" class="sr-only"></div>
    ${renderSearchBox(state)}
    ${renderFilters(state)}
    ${state.results.length > 0 ? renderResults(state.results) : renderEmptyState(state)}
  `
}

/* ─── 搜尋框 ─────────────────────────────── */

function renderSearchBox(state) {
  return `
    <div class="search-box">
      <div class="search-box__input-wrap">
        <span class="search-box__icon">${icons.search}</span>
        <input
          type="text"
          class="search-box__input"
          id="search-input"
          placeholder="輸入品牌 + 色號，如 Dior 075"
          value="${escapeAttr(state.query)}"
          maxlength="100"
          autocomplete="off"
          role="combobox"
          aria-label="搜尋品牌與色號"
          aria-expanded="false"
          aria-autocomplete="list"
          aria-controls="search-listbox"
        >
        <button class="search-box__btn" data-action="search" aria-label="搜尋">搜尋</button>
      </div>
    </div>
  `
}

/* ─── 篩選器 ─────────────────────────────── */

function renderFilters(state) {
  const filters = [
    { key: 'tw', label: '台灣' },
    { key: 'jp', label: '日本' },
    { key: 'all', label: '全部來源' },
  ]

  return `
    <div class="filter-pills" role="radiogroup" aria-label="地區篩選">
      ${filters.map(f => `
        <button
          class="filter-pill${state.regionFilter === f.key ? ' filter-pill--active' : ''}"
          data-action="filter"
          data-region="${f.key}"
          role="radio"
          aria-checked="${state.regionFilter === f.key}"
        >${f.label}</button>
      `).join('')}
    </div>
  `
}

/* ─── 品牌快選 ────────────────────────────── */

export function renderBrandGrid() {
  const prestige = brands.filter(b => b.category === 'prestige')
  const drugstore = brands.filter(b => b.category === 'drugstore')

  return `
    <section class="brand-section">
      <h2 class="section-title">${icons.sparkles} 熱門品牌快選</h2>

      <div class="brand-category">
        <h3 class="brand-category__title">專櫃品牌</h3>
        <div class="brand-grid">
          ${prestige.map(b => `
            <button class="brand-chip" data-action="select-brand" data-brand-id="${escapeAttr(b.id)}">
              ${escapeHTML(b.name_en)}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="brand-category">
        <h3 class="brand-category__title">日系開架</h3>
        <div class="brand-grid">
          ${drugstore.map(b => `
            <button class="brand-chip brand-chip--drugstore" data-action="select-brand" data-brand-id="${escapeAttr(b.id)}">
              ${escapeHTML(b.name_en)}
            </button>
          `).join('')}
        </div>
      </div>
    </section>
  `
}

/* ─── 搜尋結果 ────────────────────────────── */

function renderImageSearchCard(results) {
  if (!results.length) return ''
  // 從第一筆結果反推搜尋詞（品牌 + 色號）
  const first = results[0]
  const query = first.query.replace(/\s*site:\S+/g, '').trim()
  if (!query) return ''
  const imageUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`

  return `
    <a class="image-search-card" href="${escapeAttr(imageUrl)}" target="_blank" rel="noopener" aria-label="在 Google 圖片搜尋 ${escapeAttr(query)}">
      <div class="image-search-card__icon">${icons.image}</div>
      <div class="image-search-card__content">
        <div class="image-search-card__title">查看試色圖片</div>
        <div class="image-search-card__query">${escapeHTML(query)}</div>
        <div class="image-search-card__source">Google 圖片搜尋</div>
      </div>
      <span class="image-search-card__arrow">${icons.externalLink}</span>
    </a>
  `
}

function renderResults(results) {
  // 按 Tier 分組
  const grouped = {}
  for (const r of results) {
    const tier = r.source.tier
    if (!grouped[tier]) grouped[tier] = []
    grouped[tier].push(r)
  }

  const tiers = Object.keys(grouped).sort((a, b) => a - b)

  return `
    <section class="results">
      ${renderImageSearchCard(results)}
      ${tiers.map(tier => {
        const meta = tierMeta[tier] || defaultTierMeta
        const items = grouped[tier]
        return `
          <div class="tier-group">
            <div class="tier-group__header">
              <span class="tier-badge" style="--tier-color: ${meta.color}">
                ${tierIcons[tier] || ''} ${escapeHTML(meta.label)}
              </span>
            </div>
            <div class="tier-group__list">
              ${items.map(r => renderResultCard(r)).join('')}
            </div>
          </div>
        `
      }).join('')}
    </section>
  `
}

function renderResultCard(result) {
  const { source, url } = result
  const meta = tierMeta[source.tier] || defaultTierMeta

  return `
    <a class="result-card" href="${escapeAttr(url)}" target="_blank" rel="noopener" style="--tier-color: ${meta.color}" aria-label="在 ${escapeAttr(source.name)} 搜尋">
      <div class="result-card__info">
        <div class="result-card__name">${escapeHTML(source.name)}</div>
        <div class="result-card__domain">${escapeHTML(source.domain)}</div>
        <div class="result-card__desc">${escapeHTML(source.description)}</div>
      </div>
      <span class="result-card__arrow">${icons.externalLink}</span>
    </a>
  `
}

/* ─── 空狀態 ──────────────────────────────── */

function renderEmptyState(state) {
  if (state.hasSearched) {
    return `
      <div class="empty-state">
        <p class="empty-state__text">找不到相關結果，請確認品牌名稱與色號。</p>
      </div>
    `
  }

  return `
    <div class="empty-state">
      <p class="empty-state__text">輸入品牌名稱和色號，我們會從日本＆台灣最可靠的美妝來源幫你找試色。</p>
    </div>
    ${renderBrandGrid()}
  `
}

/* ─── 工具函數 ────────────────────────────── */

function escapeHTML(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function escapeAttr(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
