/**
 * 檔名格式工具
 * 支援多種輸出格式與本地記憶
 */

// 格式選項
export const FILENAME_FORMATS = [
  { id: 'title-author', label: '《書名》作者', example: '《魔法四萬年》作者' },
  { id: 'author-title', label: '作者《書名》', example: '作者《魔法四萬年》' },
  { id: 'title-only', label: '書名', example: '魔法四萬年' },
  { id: 'title-date', label: '《書名》_日期', example: '《魔法四萬年》_20260129' },
  { id: 'custom', label: '自訂格式', example: '' },
]

// 自訂格式可用的方塊
export const CUSTOM_BLOCKS = [
  { id: 'date', label: '日期', preview: '20260129' },
  { id: 'title', label: '書名', preview: '書名' },
  { id: 'author', label: '作者', preview: '作者' },
  { id: 'exporter', label: '輸出者', preview: '輸出者' },
]

// 從 localStorage 讀取偏好
export function loadFilenamePrefs() {
  try {
    const saved = localStorage.getItem('epub-filename-prefs')
    if (saved) {
      const parsed = JSON.parse(saved)
      // 確保有 customBlocks 和 exporter 欄位
      return {
        format: parsed.format || 'title-author',
        includeDate: parsed.includeDate || false,
        customTemplate: parsed.customTemplate || '',
        customBlocks: parsed.customBlocks || ['title'],
        exporter: parsed.exporter || '',
      }
    }
  } catch (e) {
    console.warn('無法讀取檔名偏好設定')
  }
  return {
    format: 'title-author',
    includeDate: false,
    customTemplate: '',
    customBlocks: ['title'],
    exporter: '',
  }
}

// 儲存偏好到 localStorage
export function saveFilenamePrefs(prefs) {
  try {
    localStorage.setItem('epub-filename-prefs', JSON.stringify(prefs))
  } catch (e) {
    console.warn('無法儲存檔名偏好設定')
  }
}

// 取得今天日期字串
function getTodayString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 根據格式生成檔名
export function generateFilename({ title, author, exporter, format, includeDate, customTemplate, customBlocks }) {
  let filename = ''
  
  switch (format) {
    case 'title-author':
      filename = author ? `《${title}》${author}` : `《${title}》`
      break
    case 'author-title':
      filename = author ? `${author}《${title}》` : `《${title}》`
      break
    case 'title-only':
      filename = title
      break
    case 'title-date':
      filename = `《${title}》_${getTodayString()}`
      break
    case 'custom':
      // 使用方塊組合生成檔名
      if (customBlocks && customBlocks.length > 0) {
        const parts = customBlocks.map(blockId => {
          switch (blockId) {
            case 'date': return getTodayString()
            case 'title': return title
            case 'author': return author || ''
            case 'exporter': return exporter || ''
            default: return ''
          }
        }).filter(p => p) // 過濾空值
        filename = parts.join('_')
      } else if (customTemplate) {
        // 向下相容舊的 customTemplate
        filename = customTemplate
          .replace('{title}', title)
          .replace('{author}', author || '')
          .replace('{exporter}', exporter || '')
          .replace('{date}', getTodayString())
      } else {
        filename = title
      }
      break
    default:
      filename = title
  }
  
  // 額外加日期選項
  if (includeDate && format !== 'title-date' && format !== 'custom') {
    filename += `_${getTodayString()}`
  }
  
  // 清理不合法的檔名字元
  filename = filename.replace(/[<>:"/\\|?*]/g, '')
  
  return filename
}
