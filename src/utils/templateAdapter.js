/**
 * TemplateAdapter — 統一入口
 *
 * 各模板的實作邏輯分散在獨立檔案：
 * - theaterAdapter.js  → 雜誌感設計排版
 * - broetryAdapter.js  → Broetry 文體排版
 */

import { theaterTransform, theaterValidate, TITLE_STYLES } from './theaterAdapter'
import { broetryTransform, broetryValidate } from './broetryAdapter'

// ─── 設定常數 ─────────────────────────────────────────

export const TEMPLATE_MODES = [
  { id: 'original', name: '原始', description: '保留原文內容，僅修復平台換行消失問題' },
  { id: 'theater', name: '雜誌感設計排版', description: '符號轉換・欄位對齊・標題飾條' },
  { id: 'broetry', name: 'Broetry 文體排版', description: '自動分段・雙換行・留白節奏' },
]

export const TITLE_STYLE_OPTIONS = [
  { id: 'checkerboard', label: '▞▞▞ 標題 ▞▞▞' },
  { id: 'gradient', label: '░▒▓ 標題 ▓▒░' },
  { id: 'box', label: '▛▀▀▀ 標題 ▀▀▀▜' },
]

export const TITLE_DETECT_OPTIONS = [
  { id: 'auto', label: '自動偵測', desc: '第一行為主標題，短句且無句末標點自動判定為段落標題' },
  { id: 'manual', label: '自行填寫', desc: '在標題欄位輸入，內文不會被自動判定為標題' },
]

// ─── 統一 transform 入口 ──────────────────────────────

export function applyTemplate(text, modeId, options = {}) {
  if (!text && !(options.titleDetect === 'manual' && options.manualTitle?.trim())) return ''
  switch (modeId) {
    case 'theater':
      return theaterTransform(text, options)
    case 'broetry':
      return broetryTransform(text, options)
    default: {
      // 原始模式：手動標題時在內文前加上標題
      if (options.titleDetect === 'manual' && options.manualTitle?.trim()) {
        return options.manualTitle.trim() + (text ? '\n\n' + text : '')
      }
      return text
    }
  }
}

// ─── 統一 validate 入口 ──────────────────────────────

export function validateTemplate(text, modeId) {
  if (!text) return { valid: true, warnings: [] }
  switch (modeId) {
    case 'theater':
      return theaterValidate(text)
    case 'broetry':
      return broetryValidate(text)
    default:
      return { valid: true, warnings: [] }
  }
}
