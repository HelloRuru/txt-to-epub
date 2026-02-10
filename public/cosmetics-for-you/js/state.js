/**
 * state.js
 * 全域狀態管理
 */

export const state = {
  query: '',
  brand: null,
  colorCode: '',
  regionFilter: 'tw',
  categoryFilter: 'all',
  results: [],
  suggestions: [],   // unified: [{ type, data }]
  showSuggestions: false,
  hasSearched: false,
  suggestionIndex: -1,
  // 匯率計算機
  exchangeRate: null,
  exchangeRateTime: '',
  showExchangeCalc: false,
  jpyAmount: '',
  // 分享功能
  showShareMenu: false,
  // 搜尋歷史
  searchHistory: [],  // 最多 5 筆
  // 熱門搜尋
  popularSearches: [],  // Top 5 最多人查
}
