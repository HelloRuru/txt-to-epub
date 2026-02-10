/**
 * nicknames.js — 台灣常用色號暱稱資料庫
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 *
 * 包含特定品牌色號暱稱與通用色系暱稱
 */

export const nicknames = [
  // ── 特定品牌色號暱稱 ──────────────────
  { nickname: '爛番茄色', brandId: 'ysl', color: '416', desc: 'YSL 416' },
  { nickname: '小金條', brandId: 'ysl', color: '', desc: 'YSL 奢華緞面系列' },
  { nickname: '999', brandId: 'dior', color: '999', desc: 'Dior 999 經典正紅' },
  { nickname: '720', brandId: 'dior', color: '720', desc: 'Dior 720 薔薇木' },
  { nickname: '黑管', brandId: 'mac', color: '', desc: 'MAC 子彈唇膏' },
  { nickname: '小辣椒', brandId: 'mac', color: 'Chili', desc: 'MAC Chili' },
  { nickname: 'Ruby Woo', brandId: 'mac', color: 'Ruby Woo', desc: 'MAC 經典正紅' },
  { nickname: '禁忌之吻', brandId: 'givenchy', color: '', desc: 'Givenchy 經典系列' },

  // ── 通用色系暱稱 ──────────────────────
  { nickname: '豆沙色', brandId: null, color: '', desc: '溫柔豆沙粉紅色系' },
  { nickname: '乾燥玫瑰', brandId: null, color: '', desc: '低飽和玫瑰色系' },
  { nickname: '奶茶色', brandId: null, color: '', desc: '裸色系、溫柔日常色' },
  { nickname: '斬男色', brandId: null, color: '', desc: '偏粉嫩的吸引力色系' },
  { nickname: '楓葉色', brandId: null, color: '', desc: '暖調紅棕色系' },
  { nickname: '蜜桃色', brandId: null, color: '', desc: '粉嫩桃色系' },
  { nickname: '姨媽色', brandId: null, color: '', desc: '深暗紅色系' },
  { nickname: '吃土色', brandId: null, color: '', desc: '偏棕裸色系' },
  { nickname: '牛血色', brandId: null, color: '', desc: '濃郁深紅色系' },
  { nickname: '車厘子色', brandId: null, color: '', desc: '鮮豔櫻桃紅' },
  { nickname: '鐵鏽紅', brandId: null, color: '', desc: '暖調鏽紅色系' },
  { nickname: '玫瑰木', brandId: null, color: '', desc: '低調玫瑰棕色系' },
  { nickname: '裸色', brandId: null, color: '', desc: '接近膚色的自然色' },
  { nickname: '正紅色', brandId: null, color: '', desc: '經典大紅色' },
  { nickname: '番茄紅', brandId: null, color: '', desc: '鮮豔番茄色系' },
  { nickname: '水蜜桃', brandId: null, color: '', desc: '粉嫩水蜜桃色系' },
  { nickname: '大地色', brandId: null, color: '', desc: '棕色系眼影' },
  { nickname: '消腫色', brandId: null, color: '', desc: '啞光淺棕眼影' },
  { nickname: '花瓣色', brandId: null, color: '', desc: '淡雅花瓣粉色系' },
]

/**
 * 搜尋暱稱建議
 */
export function searchNicknames(input) {
  if (!input || input.length < 1) return []
  const q = input.trim()
  return nicknames.filter(n => n.nickname.includes(q)).slice(0, 4)
}
