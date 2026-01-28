import { useState, useEffect } from 'react'
import { FONT_CONFIG, DEFAULT_FONT } from '../utils/fontSubset'
import { useTheme } from '../contexts/ThemeContext'
import { FILENAME_FORMATS, loadFilenamePrefs, saveFilenamePrefs, generateFilename } from '../utils/filenameFormat'

export default function SettingsPanel({ settings, setSettings }) {
  const { isDark } = useTheme()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filenamePrefs, setFilenamePrefs] = useState(loadFilenamePrefs)

  // 當檔名偏好改變時，儲存並更新 settings
  useEffect(() => {
    saveFilenamePrefs(filenamePrefs)
    setSettings(prev => ({
      ...prev,
      filenameFormat: filenamePrefs.format,
      filenameIncludeDate: filenamePrefs.includeDate,
      filenameCustomTemplate: filenamePrefs.customTemplate,
    }))
  }, [filenamePrefs, setSettings])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleFilenameFormatChange = (format) => {
    setFilenamePrefs(prev => ({ ...prev, format }))
  }

  const selectedFont = FONT_CONFIG[settings.fontFamily] || FONT_CONFIG[DEFAULT_FONT]

  // 預覽檔名
  const previewFilename = generateFilename({
    title: settings.title || '書名',
    author: settings.author || '',
    format: filenamePrefs.format,
    includeDate: filenamePrefs.includeDate,
    customTemplate: filenamePrefs.customTemplate,
  })

  // 共用樣式
  const labelClass = `text-sm ${isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-600/80'}`
  const headingClass = `font-medium ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`
  const subTextClass = `text-xs ${isDark ? 'text-nadeshiko-400/60' : 'text-nadeshiko-500/60'}`
  const inputClass = `w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none ${
    isDark 
      ? 'bg-dark-bg border-dark-border text-nadeshiko-200 placeholder:text-nadeshiko-600 focus:border-nadeshiko-600' 
      : 'bg-white border-nadeshiko-200 text-nadeshiko-800 placeholder:text-nadeshiko-400 focus:border-nadeshiko-400'
  }`
  const cardClass = `p-4 rounded-xl transition-colors ${
    isDark ? 'bg-nadeshiko-900/10 border border-dark-border' : 'bg-nadeshiko-50/50 border border-nadeshiko-200'
  }`

  const getButtonClass = (isActive) => `
    p-3 rounded-xl border text-left transition-all btn-press
    ${isActive 
      ? 'border-nadeshiko-400 bg-nadeshiko-400/10' 
      : isDark
        ? 'border-dark-border hover:border-nadeshiko-600'
        : 'border-nadeshiko-200 hover:border-nadeshiko-300'
    }
  `

  const getSmallButtonClass = (isActive) => `
    py-2 px-3 rounded-lg border text-sm transition-all btn-press
    ${isActive 
      ? 'border-nadeshiko-400 bg-nadeshiko-400/10 ' + (isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700')
      : isDark
        ? 'border-dark-border text-nadeshiko-400 hover:border-nadeshiko-600'
        : 'border-nadeshiko-200 text-nadeshiko-500 hover:border-nadeshiko-300'
    }
  `

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg flex items-center gap-2 ${headingClass}`}>
          <span>⚙️</span> 書籍設定
        </h3>
        <div className="decorative-line mt-2"></div>
      </div>

      {/* 基本資訊 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={labelClass}>書名</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="輸入書名"
            className={inputClass}
          />
          <p className={subTextClass}>輸出檔名也會使用此名稱</p>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>作者</label>
          <input
            type="text"
            value={settings.author}
            onChange={(e) => handleChange('author', e.target.value)}
            placeholder="輸入作者名稱（選填）"
            className={inputClass}
          />
        </div>
      </div>

      {/* 輸出檔名格式 */}
      <div className={`space-y-4 ${cardClass}`}>
        <div>
          <p className={headingClass}>輸出檔名格式</p>
          <p className={subTextClass}>選擇偏好的檔名格式，設定會自動記住</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {FILENAME_FORMATS.filter(f => f.id !== 'custom').map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => handleFilenameFormatChange(fmt.id)}
              className={getSmallButtonClass(filenamePrefs.format === fmt.id)}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        {/* 自訂選項 */}
        <button
          onClick={() => handleFilenameFormatChange('custom')}
          className={`w-full ${getSmallButtonClass(filenamePrefs.format === 'custom')}`}
        >
          自訂格式
        </button>

        {filenamePrefs.format === 'custom' && (
          <div className="space-y-2">
            <input
              type="text"
              value={filenamePrefs.customTemplate}
              onChange={(e) => setFilenamePrefs(prev => ({ ...prev, customTemplate: e.target.value }))}
              placeholder="使用 {title}、{author}、{date} 變數"
              className={inputClass}
            />
            <p className={subTextClass}>
              例如：{'{author}'}_{'{title}'}_{'{date}'} → 作者_書名_20260129
            </p>
          </div>
        )}

        {/* 加入日期選項 */}
        {filenamePrefs.format !== 'title-date' && filenamePrefs.format !== 'custom' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filenamePrefs.includeDate}
              onChange={(e) => setFilenamePrefs(prev => ({ ...prev, includeDate: e.target.checked }))}
              className="w-4 h-4 rounded border-nadeshiko-300 text-nadeshiko-400 focus:ring-nadeshiko-400"
            />
            <span className={isDark ? 'text-nadeshiko-300' : 'text-nadeshiko-600'}>
              加上轉換日期
            </span>
          </label>
        )}

        {/* 預覽 */}
        <div className={`p-3 rounded-lg ${isDark ? 'bg-dark-bg' : 'bg-white'}`}>
          <p className={subTextClass}>預覽：</p>
          <p className={`font-medium ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
            {previewFilename}.epub
          </p>
        </div>
      </div>

      {/* 簡轉繁 */}
      <div className={`flex items-center justify-between ${cardClass}`}>
        <div>
          <p className={headingClass}>簡體轉繁體</p>
          <p className={subTextClass}>使用 OpenCC 繁化姬引擎，含詞彙轉換</p>
        </div>
        <button
          onClick={() => handleChange('convertToTraditional', !settings.convertToTraditional)}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            settings.convertToTraditional ? 'bg-nadeshiko-400' : isDark ? 'bg-dark-border' : 'bg-nadeshiko-200'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              settings.convertToTraditional ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* 排版方向 */}
      <div className="space-y-3">
        <p className={labelClass}>排版方向</p>
        <div className="flex gap-4">
          {[
            { id: 'horizontal', label: '橫排 →', desc: '現代閱讀習慣，由左至右' },
            { id: 'vertical', label: '直排 ↓', desc: '傳統中文，由上至下' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleChange('writingMode', mode.id)}
              className={`flex-1 ${getButtonClass(settings.writingMode === mode.id)}`}
            >
              <p className={`font-medium mb-1 ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
                {mode.label}
              </p>
              <p className={subTextClass}>{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 字型選擇 */}
      <div className="space-y-3">
        <p className={labelClass}>字型風格</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(FONT_CONFIG).map((font) => (
            <button
              key={font.id}
              onClick={() => handleChange('fontFamily', font.id)}
              className={getButtonClass(settings.fontFamily === font.id)}
            >
              <p className={`font-medium text-sm ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
                {font.name}
              </p>
              <p className={subTextClass}>{font.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 字型嵌入選項 */}
      <div className={`space-y-3 ${cardClass}`}>
        <p className={labelClass}>字型處理方式</p>
        
        <button
          onClick={() => handleChange('embedFont', false)}
          className={`w-full ${getButtonClass(!settings.embedFont)}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">📱</span>
            <div>
              <p className={`font-medium ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
                使用閱讀器字型
              </p>
              <p className={`${subTextClass} mt-1`}>
                檔案較小。電子書會建議使用「{selectedFont.name}」，但實際顯示取決於閱讀器設定。
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleChange('embedFont', true)}
          className={`w-full ${getButtonClass(settings.embedFont)}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">📦</span>
            <div>
              <p className={`font-medium ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
                嵌入字型（子集化）
              </p>
              <p className={`${subTextClass} mt-1`}>
                只保留書中用到的字，檔案約 +300KB~1MB。無論在哪個閱讀器都顯示「{selectedFont.name}」。
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
                ⚡ 首次使用需下載完整字型（約 5~20MB），之後會自動快取
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* 進階選項切換 */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={`w-full p-3 rounded-xl border transition-all btn-press flex items-center justify-center gap-2 ${
          isDark 
            ? 'border-dark-border text-nadeshiko-400 hover:border-nadeshiko-600' 
            : 'border-nadeshiko-200 text-nadeshiko-500 hover:border-nadeshiko-300'
        }`}
      >
        <span>{showAdvanced ? '收起' : '展開'}進階排版選項</span>
        <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* 進階選項 */}
      {showAdvanced && (
        <div className={`space-y-6 ${cardClass}`}>
          
          {/* 字體大小 */}
          <div className="space-y-3">
            <p className={labelClass}>字體大小</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'small', name: '小', desc: '適合大螢幕' },
                { id: 'medium', name: '中', desc: '一般閱讀' },
                { id: 'large', name: '大', desc: '輕鬆閱讀' },
                { id: 'xlarge', name: '特大', desc: '護眼模式' },
              ].map((size) => (
                <button
                  key={size.id}
                  onClick={() => handleChange('fontSize', size.id)}
                  className={`text-center ${getSmallButtonClass(settings.fontSize === size.id)}`}
                >
                  <p className="font-medium">{size.name}</p>
                  <p className={`text-xs ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
                    {size.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 行高 */}
          <div className="space-y-3">
            <p className={labelClass}>行距</p>
            <div className="flex gap-2">
              {[
                { id: 'compact', name: '緊湊' },
                { id: 'normal', name: '適中' },
                { id: 'relaxed', name: '寬鬆' },
                { id: 'loose', name: '特寬' },
              ].map((lh) => (
                <button
                  key={lh.id}
                  onClick={() => handleChange('lineHeight', lh.id)}
                  className={`flex-1 ${getSmallButtonClass(settings.lineHeight === lh.id)}`}
                >
                  {lh.name}
                </button>
              ))}
            </div>
          </div>

          {/* 首行縮排 */}
          <div className="space-y-3">
            <p className={labelClass}>段落首行縮排</p>
            <div className="flex gap-2">
              {[
                { id: 'none', name: '無' },
                { id: 'one', name: '1字' },
                { id: 'two', name: '2字' },
              ].map((indent) => (
                <button
                  key={indent.id}
                  onClick={() => handleChange('textIndent', indent.id)}
                  className={`flex-1 ${getSmallButtonClass(settings.textIndent === indent.id)}`}
                >
                  {indent.name}
                </button>
              ))}
            </div>
          </div>

          <p className={`text-xs ${isDark ? 'text-nadeshiko-600' : 'text-nadeshiko-400'}`}>
            💡 這些設定會寫入電子書，但部分閱讀器可能會用自己的設定覆蓋
          </p>
        </div>
      )}
    </div>
  )
}
