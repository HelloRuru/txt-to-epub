/**
 * 台灣專櫃/開架美妝品參考價格資料庫
 *
 * 資料來源：品牌官網、百貨公司專櫃、藥妝店
 * 更新頻率：建議每 3-6 個月更新一次
 *
 * 價格區間說明：
 * - min/max 代表該品類的常見價格範圍
 * - 不包含限定款或特殊系列（價格可能更高）
 * - 價格以新台幣（TWD）計價
 */

export const taiwanPrices = {
  // ===== 專櫃品牌 =====

  'ysl': {
    'lipstick': { min: 1200, max: 1450, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 1600, max: 2400, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1500, max: 1800, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1800, max: 2500, updatedAt: '2026-02-11', source: '官網' }
  },

  'dior': {
    'lipstick': { min: 1300, max: 1550, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 1800, max: 2800, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1600, max: 1900, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1900, max: 2800, updatedAt: '2026-02-11', source: '官網' }
  },

  'chanel': {
    'lipstick': { min: 1400, max: 1600, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 1900, max: 3200, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1700, max: 2000, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 2200, max: 3000, updatedAt: '2026-02-11', source: '官網' }
  },

  'tom ford': {
    'lipstick': { min: 1500, max: 1800, updatedAt: '2026-02-11', source: '百貨專櫃' },
    'eyeshadow': { min: 2200, max: 3800, updatedAt: '2026-02-11', source: '百貨專櫃' },
    'blush': { min: 1900, max: 2200, updatedAt: '2026-02-11', source: '百貨專櫃' },
    'foundation': { min: 2400, max: 3200, updatedAt: '2026-02-11', source: '百貨專櫃' }
  },

  'lancôme': {
    'lipstick': { min: 1100, max: 1350, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 1500, max: 2200, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1400, max: 1700, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1700, max: 2400, updatedAt: '2026-02-11', source: '官網' }
  },

  'armani': {
    'lipstick': { min: 1250, max: 1500, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 1700, max: 2600, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1550, max: 1850, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1850, max: 2700, updatedAt: '2026-02-11', source: '官網' }
  },

  'estée lauder': {
    'lipstick': { min: 1000, max: 1250, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 1400, max: 2000, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1300, max: 1600, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1600, max: 2300, updatedAt: '2026-02-11', source: '官網' }
  },

  'mac': {
    'lipstick': { min: 850, max: 950, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 700, max: 900, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 950, max: 1050, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1200, max: 1600, updatedAt: '2026-02-11', source: '官網' }
  },

  'bobbi brown': {
    'lipstick': { min: 1100, max: 1300, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 900, max: 1400, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1200, max: 1500, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1600, max: 2200, updatedAt: '2026-02-11', source: '官網' }
  },

  'nars': {
    'lipstick': { min: 1050, max: 1250, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 1400, max: 2100, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1200, max: 1500, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1700, max: 2300, updatedAt: '2026-02-11', source: '官網' }
  },

  'shiseido': {
    'lipstick': { min: 900, max: 1200, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 1100, max: 1800, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1000, max: 1400, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1400, max: 2000, updatedAt: '2026-02-11', source: '官網' }
  },

  'shu uemura': {
    'lipstick': { min: 950, max: 1200, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 850, max: 1500, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 1100, max: 1400, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 1500, max: 2100, updatedAt: '2026-02-11', source: '官網' }
  },

  // ===== 開架品牌 =====

  'maybelline': {
    'lipstick': { min: 200, max: 350, updatedAt: '2026-02-11', source: '藥妝店' },
    'eyeshadow': { min: 250, max: 450, updatedAt: '2026-02-11', source: '藥妝店' },
    'blush': { min: 250, max: 400, updatedAt: '2026-02-11', source: '藥妝店' },
    'foundation': { min: 300, max: 550, updatedAt: '2026-02-11', source: '藥妝店' }
  },

  "l'oréal": {
    'lipstick': { min: 250, max: 400, updatedAt: '2026-02-11', source: '藥妝店' },
    'eyeshadow': { min: 300, max: 500, updatedAt: '2026-02-11', source: '藥妝店' },
    'blush': { min: 280, max: 450, updatedAt: '2026-02-11', source: '藥妝店' },
    'foundation': { min: 350, max: 600, updatedAt: '2026-02-11', source: '藥妝店' }
  },

  'revlon': {
    'lipstick': { min: 220, max: 380, updatedAt: '2026-02-11', source: '藥妝店' },
    'eyeshadow': { min: 280, max: 480, updatedAt: '2026-02-11', source: '藥妝店' },
    'blush': { min: 260, max: 420, updatedAt: '2026-02-11', source: '藥妝店' },
    'foundation': { min: 320, max: 580, updatedAt: '2026-02-11', source: '藥妝店' }
  },

  'cezanne': {
    'lipstick': { min: 150, max: 280, updatedAt: '2026-02-11', source: '藥妝店' },
    'eyeshadow': { min: 180, max: 350, updatedAt: '2026-02-11', source: '藥妝店' },
    'blush': { min: 180, max: 320, updatedAt: '2026-02-11', source: '藥妝店' },
    'foundation': { min: 250, max: 450, updatedAt: '2026-02-11', source: '藥妝店' }
  },

  'canmake': {
    'lipstick': { min: 180, max: 300, updatedAt: '2026-02-11', source: '藥妝店' },
    'eyeshadow': { min: 200, max: 380, updatedAt: '2026-02-11', source: '藥妝店' },
    'blush': { min: 200, max: 350, updatedAt: '2026-02-11', source: '藥妝店' },
    'foundation': { min: 280, max: 480, updatedAt: '2026-02-11', source: '藥妝店' }
  },

  'innisfree': {
    'lipstick': { min: 200, max: 350, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 250, max: 450, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 230, max: 400, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 300, max: 550, updatedAt: '2026-02-11', source: '官網' }
  },

  'etude house': {
    'lipstick': { min: 180, max: 320, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 220, max: 420, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 210, max: 380, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 280, max: 520, updatedAt: '2026-02-11', source: '官網' }
  },

  'peripera': {
    'lipstick': { min: 170, max: 310, updatedAt: '2026-02-11', source: '官網' },
    'eyeshadow': { min: 210, max: 400, updatedAt: '2026-02-11', source: '官網' },
    'blush': { min: 200, max: 370, updatedAt: '2026-02-11', source: '官網' },
    'foundation': { min: 270, max: 500, updatedAt: '2026-02-11', source: '官網' }
  }
}

/**
 * 根據品牌 ID 和品類獲取台灣價格資料
 * @param {string} brandId - 品牌 ID（小寫，例如 'ysl'）
 * @param {string} category - 品類（'lipstick' | 'eyeshadow' | 'blush' | 'foundation' | 'other'）
 * @returns {Object|null} 價格資料 { min, max, updatedAt, source } 或 null
 */
export function getTaiwanPrice(brandId, category) {
  const normalizedBrand = brandId.toLowerCase()

  // 如果品類是 'other'，嘗試使用 'foundation' 作為預設（通常是最貴的品類）
  const normalizedCategory = category === 'other' ? 'foundation' : category

  const brandPrices = taiwanPrices[normalizedBrand]
  if (!brandPrices) return null

  return brandPrices[normalizedCategory] || null
}

/**
 * 檢查價格資料是否過期（超過 6 個月）
 * @param {string} updatedAt - 更新日期（YYYY-MM-DD 格式）
 * @returns {boolean} true 表示已過期
 */
export function isPriceOutdated(updatedAt) {
  const updateDate = new Date(updatedAt)
  const now = new Date()
  const monthsDiff = (now - updateDate) / (1000 * 60 * 60 * 24 * 30)
  return monthsDiff > 6
}

/**
 * 格式化價格區間顯示
 * @param {number} min - 最低價
 * @param {number} max - 最高價
 * @returns {string} 格式化後的價格區間（例如 "NT$ 1,200-1,450"）
 */
export function formatPriceRange(min, max) {
  const formatNumber = (num) => num.toLocaleString('zh-TW')
  return `NT$ ${formatNumber(min)}-${formatNumber(max)}`
}
