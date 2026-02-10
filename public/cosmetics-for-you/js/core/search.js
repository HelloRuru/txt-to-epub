/**
 * search.js — 搜尋邏輯核心
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 *
 * 解析使用者輸入 → 比對品牌 → 產生 Google site: 搜尋連結
 */

import { brands } from './brands.js'
import { sources } from './sources.js'

/**
 * 解析使用者輸入，分離品牌名、色號、額外關鍵字
 * 「Dior 075」→ { brand: {…}, colorCode: '075', rawBrand: 'Dior', extraKeywords: '' }
 * 「植村秀 2026 口紅 熱門」→ { brand: {…}, colorCode: '', rawBrand: '植村秀', extraKeywords: '2026 口紅 熱門' }
 * 「爛番茄色 YSL」→ { brand: {…}, colorCode: '', rawBrand: 'YSL', extraKeywords: '爛番茄色' }
 */
export function parseBrandAndColor(input) {
  // 全形空格 → 半形空格
  const trimmed = input.trim().replace(/\u3000/g, ' ')
  if (!trimmed) return { brand: null, colorCode: '', rawBrand: '', extraKeywords: '' }

  // 嘗試從尾部取出色號（數字、或數字+英文組合如 075、N1、RD400）
  const colorMatch = trimmed.match(/\s+([A-Za-z]*\d[\w-]*)$/)
  let brandPart, colorCode

  if (colorMatch) {
    colorCode = colorMatch[1]
    brandPart = trimmed.slice(0, colorMatch.index).trim()
  } else {
    // 沒有色號，整段當品牌名 + 可能的額外關鍵字
    colorCode = ''
    brandPart = trimmed
  }

  // 嘗試完整 brandPart 精確匹配品牌
  const exactBrand = matchBrand(brandPart)
  if (exactBrand) {
    return { brand: exactBrand, colorCode, rawBrand: brandPart, extraKeywords: '' }
  }

  // 漸進式匹配：從右邊逐步移除詞彙（品牌通常在最前面）
  const words = brandPart.split(/\s+/)
  if (words.length > 1) {
    for (let i = words.length - 1; i >= 1; i--) {
      const attempt = words.slice(0, i).join(' ')
      const matched = matchBrand(attempt)
      if (matched) {
        return {
          brand: matched,
          colorCode,
          rawBrand: attempt,
          extraKeywords: words.slice(i).join(' '),
        }
      }
    }
    // 再試從右邊開始（品牌可能在後面，如「爛番茄色 YSL」）
    for (let i = 1; i < words.length; i++) {
      const attempt = words.slice(i).join(' ')
      const matched = matchBrand(attempt)
      if (matched) {
        return {
          brand: matched,
          colorCode,
          rawBrand: attempt,
          extraKeywords: words.slice(0, i).join(' '),
        }
      }
    }
  }

  // 沒匹配到品牌，整個 brandPart 當 rawBrand
  return { brand: null, colorCode, rawBrand: brandPart, extraKeywords: '' }
}

/**
 * 模糊比對品牌：轉小寫、去空白、查 aliases
 */
export function matchBrand(input) {
  if (!input) return null
  const normalized = input.toLowerCase().replace(/\s+/g, ' ').trim()

  for (const brand of brands) {
    // 精確比對 aliases
    for (const alias of brand.aliases) {
      if (alias.toLowerCase() === normalized) return brand
    }
    // 比對 id
    if (brand.id === normalized) return brand
    // 比對 name_en（不區分大小寫）
    if (brand.name_en.toLowerCase() === normalized) return brand
  }

  // 部分比對（輸入是品牌名的子字串，或品牌名是輸入的子字串）
  for (const brand of brands) {
    const en = brand.name_en.toLowerCase()
    if (en.includes(normalized) || normalized.includes(en)) return brand
    if (brand.name_zh && brand.name_zh.includes(input)) return brand
    if (brand.name_ja && brand.name_ja.includes(input)) return brand
  }

  return null
}

/**
 * 取得品牌搜尋建議（自動補全用）
 */
export function getSuggestions(input) {
  if (!input || input.length < 1) return []
  const normalized = input.toLowerCase().trim()

  return brands.filter(brand => {
    if (brand.id.includes(normalized)) return true
    if (brand.name_en.toLowerCase().includes(normalized)) return true
    if (brand.name_zh.includes(input)) return true
    if (brand.name_ja.includes(input)) return true
    return brand.aliases.some(a => a.toLowerCase().includes(normalized))
  }).slice(0, 6)
}

/**
 * 品類關鍵字對照表
 */
const categoryKeywordMap = {
  lipstick: { ja: 'リップ', zh: '口紅 唇膏', en: 'lipstick' },
  eyeshadow: { ja: 'アイシャドウ', zh: '眼影', en: 'eyeshadow' },
  blush: { ja: 'チーク', zh: '腮紅', en: 'blush' },
  foundation: { ja: 'ファンデーション', zh: '粉底', en: 'foundation' },
}

function getCategoryKeyword(category, searchType) {
  if (!category || category === 'all') return ''
  const map = categoryKeywordMap[category]
  if (!map) return ''
  return map[searchType] || map.zh
}

/**
 * 產生搜尋結果：每個來源一組 Google 搜尋連結
 *
 * @param {Object|null} brand - 比對到的品牌物件
 * @param {string} colorCode - 色號
 * @param {string} rawBrand - 使用者原始輸入的品牌名
 * @param {string} regionFilter - 'all' | 'jp' | 'tw'
 * @param {string} categoryFilter - 'all' | 'lipstick' | 'eyeshadow' | 'blush' | 'foundation'
 * @param {string} extraKeywords - 額外關鍵字（如 2026 熱門）
 * @returns {Array} 按 Tier 排序的結果
 */
export function generateSearchUrls(brand, colorCode, rawBrand, regionFilter, categoryFilter, extraKeywords) {
  const filtered = sources.filter(src => {
    if (regionFilter === 'all') return true
    if (regionFilter === 'jp') return src.region === 'jp'
    if (regionFilter === 'tw') return src.region === 'tw'
    return true
  })

  return filtered.map(src => {
    const query = buildQuery(src, brand, colorCode, rawBrand, categoryFilter, extraKeywords)
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`

    return {
      source: src,
      query,
      url,
    }
  })
}

/**
 * 根據來源類型組合搜尋關鍵字
 */
function buildQuery(source, brand, colorCode, rawBrand, categoryFilter, extraKeywords) {
  const color = colorCode || ''
  // YouTube / IG / 小紅書用 site: 幾乎搜不到，改為不限站
  const useSite = !source.noSiteRestrict
  const siteClause = useSite ? ` site:${source.domain}` : ''
  const categoryKw = getCategoryKeyword(categoryFilter, source.searchType)

  if (source.searchType === 'ja') {
    const name = brand ? brand.name_ja : rawBrand
    const parts = [name, color, extraKeywords, categoryKw, 'スウォッチ'].filter(Boolean)
    return parts.join(' ') + siteClause
  }

  if (source.searchType === 'zh') {
    // 台灣習慣用英文品牌名（YSL, NARS, MAC 等），所以優先使用 name_en
    const name = brand ? (brand.name_en || brand.name_zh) : rawBrand
    const parts = [name, color, extraKeywords, categoryKw, '試色 心得'].filter(Boolean)
    return parts.join(' ') + siteClause
  }

  // searchType === 'en' 或其他
  const name = brand ? brand.name_en : rawBrand
  const parts = [name, color, extraKeywords, categoryKw, 'swatch review'].filter(Boolean)
  return parts.join(' ') + siteClause
}
