import { useState } from 'react'
import { FONT_CONFIG, DEFAULT_FONT } from '../utils/fontSubset'

export default function SettingsPanel({ settings, setSettings }) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const selectedFont = FONT_CONFIG[settings.fontFamily] || FONT_CONFIG[DEFAULT_FONT]

  return (
    <div className="space-y-6">
      <h3 className="font-serif text-lg text-cream flex items-center gap-2">
        <span>⚙️</span> 書籍設定
      </h3>

      {/* 基本資訊 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-warm-400/80 text-sm">書名</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="輸入書名"
            className="w-full px-4 py-3 rounded-xl bg-warm-700/20 border border-warm-700/30 text-cream placeholder:text-warm-400/40 focus:outline-none focus:border-warm-500/50"
          />
          <p className="text-warm-400/50 text-xs">輸出檔名也會使用此名稱</p>
        </div>

        <div className="space-y-2">
          <label className="text-warm-400/80 text-sm">作者</label>
          <input
            type="text"
            value={settings.author}
            onChange={(e) => handleChange('author', e.target.value)}
            placeholder="輸入作者名稱（選填）"
            className="w-full px-4 py-3 rounded-xl bg-warm-700/20 border border-warm-700/30 text-cream placeholder:text-warm-400/40 focus:outline-none focus:border-warm-500/50"
          />
        </div>
      </div>

      {/* 簡轉繁 */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-warm-700/10">
        <div>
          <p className="text-cream font-medium">簡體轉繁體</p>
          <p className="text-warm-400/60 text-sm">使用 OpenCC 繁化姬引擎，含詞彙轉換</p>
        </div>
        <button
          onClick={() => handleChange('convertToTraditional', !settings.convertToTraditional)}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            settings.convertToTraditional ? 'bg-warm-500' : 'bg-warm-700/50'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 rounded-full bg-cream shadow transition-transform ${
              settings.convertToTraditional ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* 排版方向 */}
      <div className="space-y-3">
        <p className="text-warm-400/80 text-sm">排版方向</p>
        <div className="flex gap-4">
          <button
            onClick={() => handleChange('writingMode', 'horizontal')}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              settings.writingMode === 'horizontal'
                ? 'border-warm-500 bg-warm-500/10'
                : 'border-warm-700/30 hover:border-warm-500/30'
            }`}
          >
            <p className="text-cream font-medium mb-1">橫排 →</p>
            <p className="text-warm-400/60 text-xs">現代閱讀習慣，由左至右</p>
          </button>
          <button
            onClick={() => handleChange('writingMode', 'vertical')}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              settings.writingMode === 'vertical'
                ? 'border-warm-500 bg-warm-500/10'
                : 'border-warm-700/30 hover:border-warm-500/30'
            }`}
          >
            <p className="text-cream font-medium mb-1">直排 ↓</p>
            <p className="text-warm-400/60 text-xs">傳統中文，由上至下、由右至左</p>
          </button>
        </div>
      </div>

      {/* 字型選擇 */}
      <div className="space-y-3">
        <p className="text-warm-400/80 text-sm">字型風格</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(FONT_CONFIG).map((font) => (
            <button
              key={font.id}
              onClick={() => handleChange('fontFamily', font.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.fontFamily === font.id
                  ? 'border-warm-500 bg-warm-500/10'
                  : 'border-warm-700/30 hover:border-warm-500/30'
              }`}
            >
              <p className="text-cream font-medium text-sm">{font.name}</p>
              <p className="text-warm-400/60 text-xs">{font.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 字型嵌入選項 */}
      <div className="space-y-3 p-4 rounded-xl bg-warm-700/10 border border-warm-700/20">
        <p className="text-warm-400/80 text-sm">字型處理方式</p>
        
        <button
          onClick={() => handleChange('embedFont', false)}
          className={`w-full p-4 rounded-xl border text-left transition-all ${
            !settings.embedFont
              ? 'border-warm-500 bg-warm-500/10'
              : 'border-warm-700/30 hover:border-warm-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">📱</span>
            <div>
              <p className="text-cream font-medium">使用閱讀器字型</p>
              <p className="text-warm-400/60 text-xs mt-1">
                檔案較小。電子書會建議使用「{selectedFont.name}」，但實際顯示取決於閱讀器設定。
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleChange('embedFont', true)}
          className={`w-full p-4 rounded-xl border text-left transition-all ${
            settings.embedFont
              ? 'border-warm-500 bg-warm-500/10'
              : 'border-warm-700/30 hover:border-warm-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">📦</span>
            <div>
              <p className="text-cream font-medium">嵌入字型（子集化）</p>
              <p className="text-warm-400/60 text-xs mt-1">
                只保留書中用到的字，檔案約 +300KB~1MB。無論在哪個閱讀器都顯示「{selectedFont.name}」。
              </p>
              <p className="text-warm-500/80 text-xs mt-2">
                ⚡ 首次使用需下載完整字型（約 5~20MB），之後會自動快取
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* 進階選項切換 */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full p-3 rounded-xl border border-warm-700/30 text-warm-400 hover:border-warm-500/30 hover:text-cream transition-all flex items-center justify-center gap-2"
      >
        <span>{showAdvanced ? '收起' : '展開'}進階排版選項</span>
        <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* 進階選項 */}
      {showAdvanced && (
        <div className="space-y-6 p-4 rounded-xl bg-warm-700/5 border border-warm-700/20">
          
          {/* 字體大小 */}
          <div className="space-y-3">
            <p className="text-warm-400/80 text-sm">字體大小</p>
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
                  className={`py-2 px-3 rounded-lg border text-center transition-all ${
                    settings.fontSize === size.id
                      ? 'border-warm-500 bg-warm-500/10 text-cream'
                      : 'border-warm-700/30 text-warm-400 hover:border-warm-500/30'
                  }`}
                >
                  <p className="text-sm font-medium">{size.name}</p>
                  <p className="text-xs text-warm-400/50">{size.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 行高 */}
          <div className="space-y-3">
            <p className="text-warm-400/80 text-sm">行距</p>
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
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                    settings.lineHeight === lh.id
                      ? 'border-warm-500 bg-warm-500/10 text-cream'
                      : 'border-warm-700/30 text-warm-400 hover:border-warm-500/30'
                  }`}
                >
                  {lh.name}
                </button>
              ))}
            </div>
          </div>

          {/* 首行縮排 */}
          <div className="space-y-3">
            <p className="text-warm-400/80 text-sm">段落首行縮排</p>
            <div className="flex gap-2">
              {[
                { id: 'none', name: '無' },
                { id: 'one', name: '1字' },
                { id: 'two', name: '2字' },
              ].map((indent) => (
                <button
                  key={indent.id}
                  onClick={() => handleChange('textIndent', indent.id)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                    settings.textIndent === indent.id
                      ? 'border-warm-500 bg-warm-500/10 text-cream'
                      : 'border-warm-700/30 text-warm-400 hover:border-warm-500/30'
                  }`}
                >
                  {indent.name}
                </button>
              ))}
            </div>
          </div>

          <p className="text-warm-400/40 text-xs">
            💡 這些設定會寫入電子書，但部分閱讀器可能會用自己的設定覆蓋
          </p>

        </div>
      )}
    </div>
  )
}
