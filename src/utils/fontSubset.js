/**
 * 字型子集化工具
 * 從完整字型檔案中，只保留指定的字元，大幅縮小檔案大小
 */

import { Font } from 'fonteditor-core'

// 字型設定
export const FONT_CONFIG = {
  'noto-sans': {
    id: 'noto-sans',
    name: '思源黑體',
    file: '/fonts/NotoSansCJKtc-Regular.otf',
    family: 'Noto Sans TC',
    format: 'opentype',
    description: '清晰俐落，適合螢幕閱讀',
  },
  'noto-serif': {
    id: 'noto-serif',
    name: '思源宋體',
    file: '/fonts/NotoSerifCJKtc-Regular.otf',
    family: 'Noto Serif TC',
    format: 'opentype',
    description: '典雅正式，適合長篇小說',
  },
  'guankiap': {
    id: 'guankiap',
    name: '原俠正楷',
    file: '/fonts/GuanKiapTsingKhai-TW.ttf',
    family: 'GuanKiapTsingKhai TW',
    format: 'truetype',
    description: '手寫楷書，溫暖文青感',
  },
  'huninn': {
    id: 'huninn',
    name: 'jf 粉圓',
    file: '/fonts/jf-openhuninn.ttf',
    family: 'jf-openhuninn',
    format: 'truetype',
    description: '可愛圓體，活潑輕鬆',
  },
}

// 預設字型
export const DEFAULT_FONT = 'noto-sans'

/**
 * 從文字內容中擷取所有不重複的字元
 * @param {string} text - 文字內容
 * @returns {string} - 不重複的字元字串
 */
export function extractUniqueChars(text) {
  // 取得所有不重複字元
  const chars = [...new Set(text)].join('')
  
  // 加入基本標點符號和常用符號，確保一定會有
  const baseChars = '。，、；：？！「」『』（）【】…—　 \n\r\t'
  const numbers = '0123456789'
  const latin = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  
  const allChars = [...new Set(chars + baseChars + numbers + latin)].join('')
  
  return allChars
}

/**
 * 字型快取，避免重複下載
 */
const fontCache = new Map()

/**
 * 載入字型檔案
 * @param {string} fontId - 字型 ID
 * @returns {Promise<ArrayBuffer>} - 字型檔案的 ArrayBuffer
 */
async function loadFontFile(fontId) {
  const config = FONT_CONFIG[fontId]
  if (!config) {
    throw new Error(`未知的字型: ${fontId}`)
  }

  // 檢查快取
  if (fontCache.has(fontId)) {
    return fontCache.get(fontId)
  }

  // 下載字型檔案
  const response = await fetch(config.file)
  if (!response.ok) {
    throw new Error(`無法載入字型: ${config.name}`)
  }

  const buffer = await response.arrayBuffer()
  fontCache.set(fontId, buffer)
  
  return buffer
}

/**
 * 子集化字型
 * @param {string} fontId - 字型 ID
 * @param {string} text - 要保留的文字內容
 * @param {function} onProgress - 進度回調
 * @returns {Promise<{buffer: ArrayBuffer, format: string, family: string}>}
 */
export async function subsetFont(fontId, text, onProgress = () => {}) {
  const config = FONT_CONFIG[fontId]
  if (!config) {
    throw new Error(`未知的字型: ${fontId}`)
  }

  onProgress({ stage: 'loading', message: `正在載入 ${config.name}...` })

  // 載入原始字型
  const fontBuffer = await loadFontFile(fontId)
  
  onProgress({ stage: 'parsing', message: '正在解析字型...' })

  // 擷取需要的字元
  const chars = extractUniqueChars(text)
  const charCodes = [...chars].map(c => c.charCodeAt(0))

  onProgress({ stage: 'subsetting', message: `正在子集化（保留 ${charCodes.length} 個字元）...` })

  try {
    // 解析字型
    const font = Font.create(fontBuffer, {
      type: config.file.endsWith('.otf') ? 'otf' : 'ttf',
      subset: charCodes,
      hinting: false, // 移除 hinting 可以縮小檔案
    })

    // 修改字型名稱，加上 Subset 標記
    const fontData = font.get()
    if (fontData.name) {
      fontData.name.fontFamily = config.family
      fontData.name.fontSubFamily = 'Regular'
      fontData.name.fullName = `${config.family} Subset`
      fontData.name.postScriptName = config.family.replace(/\s/g, '')
    }
    font.set(fontData)

    onProgress({ stage: 'generating', message: '正在產生子集化字型...' })

    // 輸出為 TTF（EPUB 相容性較好）
    const subsetBuffer = font.write({
      type: 'ttf',
      hinting: false,
    })

    onProgress({ stage: 'done', message: '字型子集化完成！' })

    return {
      buffer: subsetBuffer,
      format: 'truetype',
      family: config.family,
      mimeType: 'font/ttf',
      extension: '.ttf',
    }
  } catch (error) {
    console.error('字型子集化失敗:', error)
    throw new Error(`字型子集化失敗: ${error.message}`)
  }
}

/**
 * 取得字型的 CSS @font-face 宣告
 * @param {string} family - 字型家族名稱
 * @param {string} filename - 字型檔名
 * @param {string} format - 字型格式
 * @returns {string} - CSS 內容
 */
export function generateFontFaceCSS(family, filename, format = 'truetype') {
  return `@font-face {
  font-family: "${family}";
  src: url("../fonts/${filename}") format("${format}");
  font-weight: normal;
  font-style: normal;
}`
}

/**
 * 估算子集化後的檔案大小
 * @param {number} charCount - 字元數量
 * @returns {string} - 估算大小字串
 */
export function estimateSubsetSize(charCount) {
  // 粗略估算：每個中文字約 500-1000 bytes
  const estimatedBytes = charCount * 750
  
  if (estimatedBytes < 1024) {
    return `${estimatedBytes} B`
  } else if (estimatedBytes < 1024 * 1024) {
    return `${(estimatedBytes / 1024).toFixed(1)} KB`
  } else {
    return `${(estimatedBytes / 1024 / 1024).toFixed(1)} MB`
  }
}
