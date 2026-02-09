/**
 * sources.js — 可信試色來源清單與 Tier 定義
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 */

export const tierMeta = {
  1: { label: '官方＆專業媒體', color: '#c48e8e' },
  2: { label: '高品質評測平台', color: '#9b8bb5' },
  3: { label: '台灣社群', color: '#7ba8be' },
  4: { label: '參考用來源', color: '#b0a898' },
}

/**
 * searchType:
 *   'ja' → 用日文品牌名 + スウォッチ
 *   'zh' → 用中文品牌名 + 試色
 *   'en' → 用英文品牌名 + swatch review
 */
export const sources = [
  // ── Tier 1 ─────────────────────────────
  {
    id: 'cosme',
    name: '@cosme',
    domain: 'cosme.net',
    region: 'jp',
    tier: 1,
    searchType: 'ja',
    description: '日本最大美妝口碑平台',
  },
  {
    id: 'lips',
    name: 'LIPS',
    domain: 'lipscosme.com',
    region: 'jp',
    tier: 1,
    searchType: 'ja',
    description: '日本美妝社群，素人真實試色',
  },
  {
    id: 'biteki',
    name: '美的 BITEKI',
    domain: 'biteki.com',
    region: 'jp',
    tier: 1,
    searchType: 'ja',
    description: '小學館專業美容雜誌',
  },
  {
    id: 'voce',
    name: 'VOCE',
    domain: 'i-voce.jp',
    region: 'jp',
    tier: 1,
    searchType: 'ja',
    description: '講談社美容雜誌',
  },
  {
    id: 'maquia',
    name: 'MAQUIA',
    domain: 'maquia.hpplus.jp',
    region: 'jp',
    tier: 1,
    searchType: 'ja',
    description: '集英社美容雜誌',
  },

  // ── Tier 2 ─────────────────────────────
  {
    id: 'mybest',
    name: 'my-best',
    domain: 'my-best.com',
    region: 'jp',
    tier: 2,
    searchType: 'ja',
    description: '日本專業評測比較網站',
  },
  {
    id: 'mimitv',
    name: 'MimiTV',
    domain: 'mimitv.jp',
    region: 'jp',
    tier: 2,
    searchType: 'ja',
    description: '美妝影音媒體',
  },
  {
    id: 'favor',
    name: 'FAVOR',
    domain: 'favor.life',
    region: 'jp',
    tier: 2,
    searchType: 'ja',
    description: '美妝試色專門',
  },
  {
    id: 'bijinhyakka',
    name: '美人百花',
    domain: 'bijinhyakka.com',
    region: 'jp',
    tier: 2,
    searchType: 'ja',
    description: '角川美容雜誌',
  },
  {
    id: 'meeco',
    name: 'meeco 三越',
    domain: 'meeco.mistore.jp',
    region: 'jp',
    tier: 2,
    searchType: 'ja',
    description: '三越伊勢丹美妝 EC',
  },

  // ── Tier 3 ─────────────────────────────
  {
    id: 'dcard',
    name: 'Dcard 美妝版',
    domain: 'dcard.tw',
    region: 'tw',
    tier: 3,
    searchType: 'zh',
    description: '台灣最大年輕社群',
  },
  {
    id: 'ptt',
    name: 'PTT makeup',
    domain: 'ptt.cc',
    region: 'tw',
    tier: 3,
    searchType: 'zh',
    description: 'PTT 美妝版',
  },
  {
    id: 'fashionguide',
    name: 'FashionGuide',
    domain: 'fashionguide.com.tw',
    region: 'tw',
    tier: 3,
    searchType: 'zh',
    description: '台灣美妝論壇',
  },
  {
    id: 'she',
    name: 'She 試色',
    domain: 'she.com',
    region: 'tw',
    tier: 3,
    searchType: 'zh',
    description: '台灣女性媒體',
  },
  {
    id: 'beauty321',
    name: 'beauty 美人圈',
    domain: 'beauty321.com',
    region: 'tw',
    tier: 3,
    searchType: 'zh',
    description: '台灣美妝媒體',
  },

  // ── Tier 4 ─────────────────────────────
  {
    id: 'xiaohongshu',
    name: '小紅書',
    domain: 'xiaohongshu.com',
    region: 'global',
    tier: 4,
    searchType: 'zh',
    description: '大量試色但需自行判斷',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    domain: 'youtube.com',
    region: 'global',
    tier: 4,
    searchType: 'en',
    description: '影片試色',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    domain: 'instagram.com',
    region: 'global',
    tier: 4,
    searchType: 'en',
    description: 'KOL 試色',
  },
]
