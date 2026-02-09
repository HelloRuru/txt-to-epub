/**
 * search.js — 搜尋邏輯核心
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 *
 * 解析使用者輸入 → 比對品牌 → 產生 Google site: 搜尋連結
 */

import { brands } from './brands.js'
import { sources } from './sources.js'

/**
 * 解析使用者輸入，分離品牌名與色號
 * 「Dior 075」→ { brand: {…}, colorCode: '075', rawBrand: 'Dior' }
 * 「迪奧 075」→ { brand: {…}, colorCode: '075', rawBrand: '迪奧' }
 * 「unknown 123」→ { brand: null, colorCode: '123', rawBrand: 'unknown' }
 */
export function parseBrandAndColor(input) {
  const trimmed = input.trim()
  if (!trimmed) return { brand: null, colorCode: '', rawBrand: '' }

  // 嘗試從尾部取出色號（數字、或數字+英文組合如 075、N1、RD400）
  const colorMatch = trimmed.match(/\s+([A-Za-z]*\d[\w-]*)$/)
  let brandPart, colorCode

  if (colorMatch) {
    colorCode = colorMatch[1]
    brandPart = trimmed.slice(0, colorMatch.index).trim()
  } else {
    // 沒有色號，整段當品牌名
    colorCode = ''
    brandPart = trimmed
  }

  const brand = matchBrand(brandPart)
  return { brand, colorCode, rawBrand: brandPart }
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
 * 產生搜尋結果：每個來源一組 Google 搜尋連結
 *
 * @param {Object|null} brand - 比對到的品牌物件
 * @param {string} colorCode - 色號
 * @param {string} rawBrand - 使用者原始輸入的品牌名
 * @param {string} regionFilter - 'all' | 'jp' | 'tw'
 * @returns {Array} 按 Tier 排序的結果
 */
export function generateSearchUrls(brand, colorCode, rawBrand, regionFilter) {
  const filtered = sources.filter(src => {
    if (regionFilter === 'all') return true
    if (regionFilter === 'jp') return src.region === 'jp'
    if (regionFilter === 'tw') return src.region === 'tw'
    return true
  })

  return filtered.map(src => {
    const query = buildQuery(src, brand, colorCode, rawBrand)
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
function buildQuery(source, brand, colorCode, rawBrand) {
  const color = colorCode || ''
  const siteClause = `site:${source.domain}`

  if (source.searchType === 'ja') {
    const name = brand ? brand.name_ja : rawBrand
    const keyword = color ? `${name} ${color} スウォッチ` : `${name} スウォッチ`
    return `${keyword} ${siteClause}`
  }

  if (source.searchType === 'zh') {
    const name = brand ? (brand.name_zh || brand.name_en) : rawBrand
    const keyword = color ? `${name} ${color} 試色` : `${name} 試色`
    return `${keyword} ${siteClause}`
  }

  // searchType === 'en' 或其他
  const name = brand ? brand.name_en : rawBrand
  const keyword = color ? `${name} ${color} swatch review` : `${name} swatch review`
  return `${keyword} ${siteClause}`
}
