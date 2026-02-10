/**
 * render.js — UI 渲染
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 */

import { icons, tierIcons } from '../utils/icons.js'
import { tierMeta, sources } from '../data/sources.js'
import { brands } from '../data/brands.js'
import { getCuratedPosts, hasCuratedPosts, lastUpdated } from '../data/curated-posts.js'
import { getTaiwanPrice, isPriceOutdated, formatPriceRange } from '../data/taiwan-prices.js'

const defaultTierMeta = { label: '其他', color: '#888888' }

/* ─── 主渲染 ─────────────────────────────── */

export function renderApp(state) {
  return `
    <div aria-live="polite" id="search-live" class="sr-only"></div>
    ${renderSearchBox(state)}
    ${renderSearchHistory(state)}
    <div class="filter-section">
      <h3 class="filter-section__label">區域：</h3>
      ${renderFilters(state)}
    </div>
    <div class="filter-section">
      <h3 class="filter-section__label">品項：</h3>
      ${renderCategoryFilters(state)}
    </div>
    ${renderShareButton(state)}
    ${state.results.length > 0 ? `
      <div class="results-with-calc">
        ${renderResults(state.results, state)}
        ${renderExchangeCalc(state)}
      </div>
    ` : renderEmptyState(state)}
  `
}

/* ─── 搜尋歷史 ────────────────────────────── */

function renderSearchHistory(state) {
  if (!state.searchHistory || state.searchHistory.length === 0) return ''
  if (state.hasSearched) return ''  // 搜尋後隱藏歷史

  return `
    <div class="search-history">
      <div class="search-history__header">
        <span class="search-history__title">${icons.clock} 最近搜尋</span>
        <button class="search-history__clear" data-action="clear-history" aria-label="清除全部歷史">
          ${icons.x} 清除全部
        </button>
      </div>
      <div class="search-history__list">
        ${state.searchHistory.map(query => `
          <button
            class="search-history__item"
            data-action="select-history"
            data-query="${escapeAttr(query)}"
            aria-label="搜尋 ${escapeAttr(query)}"
          >
            <span class="search-history__query">${escapeHTML(query)}</span>
            <button
              class="search-history__remove"
              data-action="remove-history"
              data-query="${escapeAttr(query)}"
              aria-label="移除 ${escapeAttr(query)}"
              tabindex="-1"
            >
              ${icons.x}
            </button>
          </button>
        `).join('')}
      </div>
    </div>
  `
}

/* ─── 搜尋框 ─────────────────────────────── */

function renderSearchBox(state) {
  // 根據螢幕寬度決定 placeholder
  const isMobile = window.innerWidth < 768
  const placeholder = isMobile
    ? '品牌 + 色號，如 Dior 075'
    : '輸入品牌 + 色號，如 Dior 075 或爛番茄色'

  return `
    <div class="search-box">
      <div class="search-box__input-wrap">
        <span class="search-box__icon">${icons.search}</span>
        <input
          type="text"
          class="search-box__input"
          id="search-input"
          placeholder="${placeholder}"
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

/* ─── 地區篩選 ────────────────────────────── */

function renderFilters(state) {
  const filters = [
    { key: 'all', label: '不限' },
    { key: 'tw', label: '台灣' },
    { key: 'jp', label: '日本' },
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

/* ─── 品類篩選 ────────────────────────────── */

function renderCategoryFilters(state) {
  const categories = [
    { key: 'all', label: '不限' },
    { key: 'lipstick', label: '口紅' },
    { key: 'eyeshadow', label: '眼影' },
    { key: 'blush', label: '腮紅' },
    { key: 'foundation', label: '其他彩妝' },
  ]

  return `
    <div class="category-filters" role="radiogroup" aria-label="品類篩選">
      ${categories.map(c => `
        <button
          class="category-pill${state.categoryFilter === c.key ? ' category-pill--active' : ''}"
          data-action="category"
          data-category="${c.key}"
          role="radio"
          aria-checked="${state.categoryFilter === c.key}"
        >${c.label}</button>
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

/**
 * Instagram 卡片（兩種模式：策展貼文縮圖 or hashtag 跳轉）
 * 從搜尋結果判斷品牌+色號，檢查是否有人工策展的貼文
 */
function renderInstagramCard(results, state) {
  if (!results.length) return ''

  const first = results[0]
  const query = first.query.replace(/\s*site:\S+/g, '').replace(/試色\s*心得/g, '').replace(/スウォッチ/g, '').replace(/swatch\s*review/gi, '').trim()
  if (!query) return ''

  // 從 query 中提取品牌+色號作為 hashtag（去空格）
  const hashtag = query.replace(/\s+/g, '').replace(/[^\w\u4e00-\u9fff]/g, '')
  if (!hashtag) return ''

  // 嘗試從 state 取得品牌 ID 和色號
  const brandId = state.brand?.id || ''
  const colorCode = state.colorCode || ''

  // 檢查是否有策展貼文
  if (brandId && colorCode && hasCuratedPosts(brandId, colorCode)) {
    const posts = getCuratedPosts(brandId, colorCode)
    return renderInstagramCuratedCard(posts, hashtag)
  }

  // 沒有策展貼文，返回 hashtag 跳轉卡片
  const igUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`

  return `
    <a class="ig-search-card" href="${escapeAttr(igUrl)}" target="_blank" rel="noopener" aria-label="在 Instagram 搜尋 #${escapeAttr(hashtag)} 試色">
      <div class="ig-search-card__icon">${icons.instagram}</div>
      <div class="ig-search-card__content">
        <div class="ig-search-card__title">Instagram 試色照</div>
        <div class="ig-search-card__hashtag">#${escapeHTML(hashtag)}</div>
        <div class="ig-search-card__hint">點擊查看真人試色貼文</div>
      </div>
      <span class="ig-search-card__arrow">${icons.externalLink}</span>
    </a>
  `
}

/**
 * Instagram 策展貼文卡片（顯示縮圖）
 */
function renderInstagramCuratedCard(posts, hashtag) {
  if (!posts || posts.length === 0) return ''

  const igUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`

  return `
    <div class="ig-curated-card">
      <div class="ig-curated-card__header">
        <div class="ig-curated-card__icon">${icons.instagram}</div>
        <div class="ig-curated-card__title">
          <div class="ig-curated-card__main-title">Instagram 精選試色</div>
          <a href="${escapeAttr(igUrl)}" target="_blank" rel="noopener" class="ig-curated-card__hashtag">
            #${escapeHTML(hashtag)}
            <span class="ig-curated-card__see-more">查看更多 ${icons.externalLink}</span>
          </a>
        </div>
      </div>
      <div class="ig-curated-card__grid" id="ig-curated-grid" data-posts='${escapeAttr(JSON.stringify(posts))}'>
        ${posts.map(url => `
          <a href="${escapeAttr(url)}" target="_blank" rel="noopener" class="ig-curated-card__post" data-url="${escapeAttr(url)}">
            <div class="ig-curated-card__placeholder">載入中...</div>
          </a>
        `).join('')}
      </div>
      <div class="ig-curated-card__footer">
        <span class="ig-curated-card__updated">最後更新：${lastUpdated}</span>
      </div>
    </div>
  `
}

function renderShareButton(state) {
  if (!state.hasSearched || !state.results.length) return ''

  return `
    <div class="share-container">
      <button class="share-btn" data-action="toggle-share" aria-label="分享搜尋結果" aria-expanded="${state.showShareMenu}">
        ${icons.share}
      </button>
      ${state.showShareMenu ? `
        <div class="share-menu" role="menu">
          <button class="share-menu__item" data-action="share-line" role="menuitem">
            ${icons.messageCircle}
            <span>LINE</span>
          </button>
          <button class="share-menu__item" data-action="share-messenger" role="menuitem">
            ${icons.send}
            <span>Messenger</span>
          </button>
          <button class="share-menu__item" data-action="copy-link" role="menuitem">
            ${icons.link}
            <span>複製連結</span>
          </button>
          <button class="share-menu__item" data-action="copy-text" role="menuitem">
            ${icons.clipboard}
            <span>複製文案</span>
          </button>
        </div>
      ` : ''}
    </div>
  `
}

function renderTopRecommendations(results) {
  // 取 Tier 1 的前三個作為推薦
  const top3 = results.filter(r => r.source.tier === 1).slice(0, 3)
  if (top3.length === 0) return ''

  return `
    <div class="top-recommendations">
      <div class="top-recommendations__header">
        <h3 class="top-recommendations__title">
          ${icons.star}
          推薦優先觀看
        </h3>
        <p class="top-recommendations__subtitle">最可靠的試色來源，幫你快速找到答案</p>
      </div>
      <div class="top-recommendations__grid">
        ${top3.map(r => renderTopRecommendationCard(r)).join('')}
      </div>
    </div>
  `
}

function renderTopRecommendationCard(result) {
  const { source, url, query } = result
  const favicon = `https://www.google.com/s2/favicons?domain=${source.domain}&sz=48`

  return `
    <div class="top-rec-card">
      <a href="${escapeAttr(url)}" target="_blank" rel="noopener" class="top-rec-card__link">
        <img src="${escapeAttr(favicon)}" alt="${escapeAttr(source.name)} icon" class="top-rec-card__icon" loading="lazy">
        <div class="top-rec-card__content">
          <div class="top-rec-card__name">${escapeHTML(source.name)}</div>
          <div class="top-rec-card__desc">${escapeHTML(source.description)}</div>
          <div class="top-rec-card__domain">${escapeHTML(source.domain)}</div>
        </div>
        <span class="top-rec-card__arrow">${icons.externalLink}</span>
      </a>
      <button class="top-rec-card__copy" data-action="copy-single-link" data-url="${escapeAttr(url)}" aria-label="複製連結">
        ${icons.link}
        <span>複製連結</span>
      </button>
    </div>
  `
}

function renderResults(results, state) {
  // 建立來源優先級映射表（sources 陣列的索引 = 優先級）
  const sourcePriorityMap = new Map()
  sources.forEach((src, index) => {
    sourcePriorityMap.set(src.id, index)
  })

  // 按 Tier 分組
  const grouped = {}
  for (const r of results) {
    const tier = r.source.tier
    if (!grouped[tier]) grouped[tier] = []
    grouped[tier].push(r)
  }

  // 同一 Tier 內按 sources 陣列順序排序（權威性排序）
  Object.keys(grouped).forEach(tier => {
    grouped[tier].sort((a, b) => {
      const prioA = sourcePriorityMap.get(a.source.id) ?? 999
      const prioB = sourcePriorityMap.get(b.source.id) ?? 999
      return prioA - prioB
    })
  })

  const tiers = Object.keys(grouped).sort((a, b) => a - b)

  return `
    <section class="results">
      ${renderTopRecommendations(results)}
      ${renderInstagramCard(results, state)}
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
      ${renderImageSearchCard(results)}
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

// 熱門色號推薦清單
const popularColors = [
  { brand: 'Dior', color: '999', desc: '經典正紅色唇膏' },
  { brand: 'MAC', color: 'Ruby Woo', desc: '霧面正紅唇膏' },
  { brand: 'YSL', color: '01', desc: '奶油玫瑰金唇膏' },
  { brand: 'CHANEL', color: '43', desc: '玫瑰豆沙色唇膏' },
  { brand: 'NARS', color: 'Orgasm', desc: '蜜桃珊瑚腮紅' },
  { brand: 'Tom Ford', color: '16', desc: '煙燻玫瑰棕唇膏' },
  { brand: 'Bobbi Brown', color: 'Pale Pink', desc: '裸色修容餅' },
  { brand: 'Estee Lauder', color: '420', desc: '玫瑰豆沙唇膏' },
]

function renderEmptyState(state) {
  if (state.hasSearched) {
    return `
      <div class="empty-state">
        <p class="empty-state__text">找不到相關結果，請確認品牌名稱與色號。</p>
        <div class="popular-colors">
          <h3 class="popular-colors__title">${icons.sparkles} 試試這些熱門色號</h3>
          <div class="popular-colors__grid">
            ${popularColors.map(item => `
              <button
                class="popular-color-chip"
                data-action="select-popular"
                data-query="${escapeAttr(item.brand + ' ' + item.color)}"
                aria-label="搜尋 ${escapeAttr(item.brand + ' ' + item.color)}"
              >
                <span class="popular-color-chip__name">${escapeHTML(item.brand)} ${escapeHTML(item.color)}</span>
                <span class="popular-color-chip__desc">${escapeHTML(item.desc)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `
  }

  // 首頁：顯示熱門搜尋（如果有）+ 品牌快選
  const hasPopular = state.popularSearches && state.popularSearches.length > 0

  return `
    <div class="empty-state">
      <p class="empty-state__text">輸入品牌名稱和色號，我們會從日本＆台灣最可靠的美妝來源幫你找試色。</p>
      ${hasPopular ? `
        <div class="trending-searches">
          <h3 class="trending-searches__title">${icons.trendingUp} 最多人查</h3>
          <div class="trending-searches__grid">
            ${state.popularSearches.map((item, index) => `
              <button
                class="trending-chip"
                data-action="select-popular"
                data-query="${escapeAttr(item.query)}"
                aria-label="搜尋 ${escapeAttr(item.query)}"
              >
                <span class="trending-chip__rank">#${index + 1}</span>
                <span class="trending-chip__query">${escapeHTML(item.query)}</span>
                <span class="trending-chip__count">${item.count} 次</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    ${renderBrandGrid()}
  `
}

/* ─── 匯率計算機 ─────────────────────────── */

function renderExchangeCalc(state) {
  const rate = state.exchangeRate
  const rateDisplay = rate ? rate.toFixed(4) : '—'
  const rateTime = state.exchangeRateTime || ''

  // 取得台灣專櫃價格資料
  let taiwanPriceBlock = ''
  if (state.brand && state.categoryFilter !== 'all') {
    const priceData = getTaiwanPrice(state.brand.id, state.categoryFilter)
    if (priceData) {
      const { min, max, updatedAt } = priceData
      const priceRange = formatPriceRange(min, max)
      const isOutdated = isPriceOutdated(updatedAt)
      const updateDate = updatedAt.slice(0, 7) // YYYY-MM

      // 品類中文名稱
      const categoryNames = {
        lipstick: '唇彩',
        eyeshadow: '眼影',
        blush: '腮紅',
        foundation: '底妝'
      }
      const categoryName = categoryNames[state.categoryFilter] || '彩妝'

      // 計算代購可省金額（如果用戶有輸入日圓金額）
      let savingsBlock = ''
      if (state.jpyAmount && rate) {
        const jpyPrice = Math.round(state.jpyAmount * rate)
        const minSavings = min - jpyPrice
        const maxSavings = max - jpyPrice

        if (minSavings > 0 && maxSavings > 0) {
          savingsBlock = `
            <div class="tw-price-compare__savings">
              <span class="tw-price-compare__savings-icon">💰</span>
              <span class="tw-price-compare__savings-text">代購約可省：NT$ ${minSavings.toLocaleString()}-${maxSavings.toLocaleString()}</span>
            </div>
          `
        } else if (maxSavings < 0) {
          savingsBlock = `
            <div class="tw-price-compare__warning">
              <span class="tw-price-compare__warning-icon">⚠️</span>
              <span class="tw-price-compare__warning-text">此價格高於台灣專櫃，建議在台灣購買</span>
            </div>
          `
        }
      }

      taiwanPriceBlock = `
        <div class="tw-price-compare">
          <div class="tw-price-compare__header">
            <span class="tw-price-compare__icon">🏬</span>
            <span class="tw-price-compare__title">台灣專櫃參考價</span>
          </div>
          <div class="tw-price-compare__price">
            <span class="tw-price-compare__category">${escapeHTML(state.brand.name)} ${categoryName}</span>
            <span class="tw-price-compare__range">${priceRange}</span>
            <span class="tw-price-compare__date ${isOutdated ? 'tw-price-compare__date--outdated' : ''}">
              （${updateDate} 更新${isOutdated ? '，價格可能已變動' : ''}）
            </span>
          </div>
          ${savingsBlock}
        </div>
      `
    }
  }

  return `
    <section class="exchange-calc">
      <button class="exchange-calc__toggle" data-action="toggle-exchange" aria-expanded="${state.showExchangeCalc ? 'true' : 'false'}">
        ${icons.calculator} 日本免稅匯率計算機
        <span class="exchange-calc__chevron ${state.showExchangeCalc ? 'exchange-calc__chevron--open' : ''}">${icons.chevronRight}</span>
      </button>
      ${state.showExchangeCalc ? `
        <div class="exchange-calc__body">
          <div class="exchange-calc__rate-info">
            <span class="exchange-calc__rate-label">目前匯率</span>
            <span class="exchange-calc__rate-value">1 JPY = ${rateDisplay} TWD</span>
            ${rateTime ? `<span class="exchange-calc__rate-time">${escapeHTML(rateTime)}</span>` : ''}
          </div>
          <div class="exchange-calc__inputs">
            <div class="exchange-calc__field">
              <label class="exchange-calc__label" for="jpy-input">日圓 ¥</label>
              <input
                type="number"
                id="jpy-input"
                class="exchange-calc__input"
                placeholder="例：3500"
                value="${escapeAttr(String(state.jpyAmount || ''))}"
                min="0"
                inputmode="numeric"
              >
            </div>
            <div class="exchange-calc__arrow-icon">${icons.chevronRight}</div>
            <div class="exchange-calc__field">
              <label class="exchange-calc__label" for="twd-output">約新台幣 NT$</label>
              <div class="exchange-calc__output" id="twd-output">
                ${state.jpyAmount && rate ? `NT$ ${Math.round(state.jpyAmount * rate).toLocaleString()}` : '—'}
              </div>
            </div>
          </div>
          <p class="exchange-calc__note">匯率每日更新，實際匯率以購買當下為準。日本免稅店價格通常約台灣專櫃 7\u20138 折</p>
          ${taiwanPriceBlock}
        </div>
      ` : ''}
    </section>
  `
}

/* ─── 工具函數 ────────────────────────────── */

function escapeHTML(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function escapeAttr(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
