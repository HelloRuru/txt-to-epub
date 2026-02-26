/**
 * Post Writer Chrome Extension — Service Worker
 *
 * 負責三件事：
 * A. 點擊工具列圖示 → 開啟 Side Panel
 * B. URL 偵測 → 通知 Side Panel 切換平台
 * C. 右鍵選單「用 Post Writer 排版」
 */

// ─── A. 點擊工具列圖示 → 開啟 Side Panel ─────────────

// 方法 1：自動行為（Chrome 116+）
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn('setPanelBehavior 失敗:', err))

// 方法 2：備案 — 如果 setPanelBehavior 沒生效，用 action.onClicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id })
  } catch (err) {
    console.warn('sidePanel.open 失敗:', err)
  }
})

// ─── B. URL 偵測 ─────────────────────────────────────

const URL_PLATFORM_MAP = [
  { pattern: /facebook\.com|fb\.com|fbcdn\.net/, platform: 'facebook' },
  { pattern: /instagram\.com/, platform: 'instagram' },
  { pattern: /threads\.net/, platform: 'threads' },
]

function detectPlatform(url) {
  if (!url) return null
  try {
    for (const { pattern, platform } of URL_PLATFORM_MAP) {
      if (pattern.test(url)) return platform
    }
  } catch {
    // 無效 URL，忽略
  }
  return null
}

function notifyPlatform(platform) {
  if (!platform) return
  chrome.runtime.sendMessage({
    type: 'platform-detected',
    platform,
  }).catch(() => {
    // Side Panel 可能未開啟，靜默忽略
  })
}

// 分頁切換時偵測 URL
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    notifyPlatform(detectPlatform(tab.url))
  } catch {
    // 分頁可能已關閉
  }
})

// 分頁 URL 變更時偵測
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    notifyPlatform(detectPlatform(tab.url))
  }
})

// ─── C. 右鍵選單 ─────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'post-writer-format',
    title: '用 Post Writer 排版',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'post-writer-format' || !info.selectionText) return

  // 1. 先開啟 Side Panel
  try {
    await chrome.sidePanel.open({ tabId: tab.id })
  } catch {
    // 已經開啟或無法開啟
  }

  // 2. 偵測平台
  const platform = detectPlatform(tab.url)

  // 3. 等 Side Panel 載入後傳送文字
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'fill-text',
      text: info.selectionText,
      platform,
    }).catch(() => {})
  }, 600)
})

// ─── D. Side Panel 主動請求目前分頁平台 ────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'get-current-platform') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ platform: detectPlatform(tabs[0].url) })
      } else {
        sendResponse({ platform: null })
      }
    })
    return true // 非同步回應
  }
})
