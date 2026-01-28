export default function SettingsPanel({ settings, setSettings }) {
  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <h3 className="font-serif text-lg text-cream flex items-center gap-2">
        <span>⚙️</span> 書籍設定
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 書名 */}
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

        {/* 作者 */}
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
          <p className="text-warm-400/60 text-sm">使用 OpenCC 繁化姬引擎</p>
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
            <p className="text-warm-400/60 text-xs">由左至右閱讀</p>
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
            <p className="text-warm-400/60 text-xs">傳統中文閱讀方向</p>
          </button>
        </div>
      </div>
    </div>
  )
}
