/**
 * features/exchange.js
 * 日圓匯率計算機
 */

/**
 * 處理日圓輸入，即時計算台幣
 */
export function handleJpyInput(e, state) {
  state.jpyAmount = e.target.value
  const output = document.getElementById('twd-output')
  if (output && state.exchangeRate) {
    const val = parseFloat(state.jpyAmount)
    output.textContent = val > 0
      ? `NT$ ${Math.round(val * state.exchangeRate).toLocaleString()}`
      : '\u2014'
  }
}

/**
 * 獲取匯率（含 sessionStorage 快取，1 小時有效）
 */
export async function fetchExchangeRate(state, render) {
  // 先從 sessionStorage 讀快取（1 小時有效）
  try {
    const cached = sessionStorage.getItem('cosmetics-exchange-rate')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < 3600000) {
        state.exchangeRate = parsed.rate
        state.exchangeRateTime = parsed.time
        render()
        return
      }
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/JPY')
    const data = await res.json()
    if (data.result === 'success' && data.rates && data.rates.TWD) {
      state.exchangeRate = data.rates.TWD
      const now = new Date()
      state.exchangeRateTime = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} 更新`

      // 快取到 sessionStorage
      try {
        sessionStorage.setItem('cosmetics-exchange-rate', JSON.stringify({
          rate: state.exchangeRate,
          time: state.exchangeRateTime,
          timestamp: Date.now(),
        }))
      } catch { /* ignore */ }

      render()
    }
  } catch {
    state.exchangeRateTime = '匯率載入失敗'
    render()
  }
}
