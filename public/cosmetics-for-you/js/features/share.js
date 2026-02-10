/**
 * features/share.js
 * 分享功能：LINE, Messenger, 複製連結, 複製文字, Toast 提示
 */

let toastTimeout = null

/**
 * 產生分享連結（含 URL 參數）
 */
export function generateShareUrl(state) {
  const params = new URLSearchParams()
  params.set('q', state.query)
  if (state.regionFilter !== 'tw') params.set('region', state.regionFilter)
  if (state.categoryFilter !== 'all') params.set('category', state.categoryFilter)
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`
}

/**
 * 產生分享文案
 */
export function generateShareText(state) {
  const brand = state.brand ? state.brand.name_en : state.query.split(' ')[0]
  const color = state.colorCode || state.query.split(' ').slice(1).join(' ')
  const text = `我在找 ${brand}${color ? ' ' + color : ''} 的試色！💄`
  const url = generateShareUrl(state)
  return `${text}\n${url}`
}

/**
 * 分享到社群平台
 * @param {'line' | 'messenger'} platform
 * @param {Object} state
 * @param {Function} render
 */
export function shareTo(platform, state, render) {
  const text = generateShareText(state)
  let shareUrl = ''

  if (platform === 'line') {
    // LINE URL Scheme
    shareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`
  } else if (platform === 'messenger') {
    // FB Messenger（需要 app_id，這裡使用簡化版）
    const url = generateShareUrl(state)
    shareUrl = `fb-messenger://share?link=${encodeURIComponent(url)}`
    // Fallback 到網頁版
    setTimeout(() => {
      window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=123456&redirect_uri=${encodeURIComponent(url)}`, '_blank')
    }, 500)
  }

  state.showShareMenu = false
  render()
  window.open(shareUrl, '_blank')
}

/**
 * 複製分享連結
 */
export async function copyShareLink(state, render) {
  const url = generateShareUrl(state)
  try {
    await navigator.clipboard.writeText(url)
    showToast('✅ 連結已複製')
  } catch {
    // Fallback
    fallbackCopy(url)
  }
  state.showShareMenu = false
  render()
}

/**
 * 複製分享文字
 */
export async function copyShareText(state, render) {
  const text = generateShareText(state)
  try {
    await navigator.clipboard.writeText(text)
    showToast('✅ 文案已複製')
  } catch {
    // Fallback
    fallbackCopy(text)
  }
  state.showShareMenu = false
  render()
}

/**
 * Fallback 複製方法（舊瀏覽器）
 */
function fallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    showToast('✅ 已複製')
  } catch {
    showToast('❌ 複製失敗')
  }
  document.body.removeChild(textarea)
}

/**
 * 顯示 Toast 提示
 */
export function showToast(message) {
  // 移除舊的 toast
  const existingToast = document.querySelector('.toast')
  if (existingToast) existingToast.remove()
  if (toastTimeout) clearTimeout(toastTimeout)

  // 建立新 toast
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  document.body.appendChild(toast)

  // 淡入動畫
  requestAnimationFrame(() => {
    toast.classList.add('toast--show')
  })

  // 2 秒後淡出並移除
  toastTimeout = setTimeout(() => {
    toast.classList.remove('toast--show')
    setTimeout(() => toast.remove(), 250)
  }, 2000)
}
