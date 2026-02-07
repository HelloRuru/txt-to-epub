/**
 * Web Worker — 字數統計 + 格式轉換
 * 在背景執行緒處理，不阻塞 UI
 */

import { transform } from './postConverter'
import { computeStats } from './platformLimits'

self.onmessage = function (e) {
  const { text, platformId, templateMode, templateOptions } = e.data

  // 格式轉換
  const converted = transform(text, platformId)

  // 字數統計
  const stats = computeStats(text, platformId)

  self.postMessage({ converted, stats })
}
