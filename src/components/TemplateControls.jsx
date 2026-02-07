import { TEMPLATE_MODES, TITLE_STYLE_OPTIONS, TITLE_DETECT_OPTIONS } from '../utils/templateAdapter'

export default function TemplateControls({
  mode,
  onModeChange,
  titleStyle,
  onTitleStyleChange,
  titleDetect,
  onTitleDetectChange,
  manualTitle,
  onManualTitleChange,
  fullWidthPunctuation,
  onFullWidthPunctuationChange,
  sentenceCase,
  onSentenceCaseChange,
  fullWidthDigit,
  onFullWidthDigitChange,
  warnings,
}) {
  return (
    <div>
      {/* 模式切換 */}
      <div className="flex gap-1.5 flex-wrap">
        {TEMPLATE_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300"
            style={{
              background: mode === m.id
                ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                : 'var(--bg-card)',
              color: mode === m.id ? 'white' : 'var(--text-secondary)',
              border: mode === m.id ? 'none' : '1px solid var(--border)',
              boxShadow: mode === m.id ? '0 2px 8px rgba(212,165,165,0.3)' : 'none',
            }}
          >
            <div>{m.name}</div>
            <div className="text-[10px] mt-0.5 opacity-60">{m.description}</div>
          </button>
        ))}
      </div>

      {/* 標題偵測方式（所有模式共用） */}
      <div className="mt-3 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {TITLE_DETECT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onTitleDetectChange(opt.id)}
              className="px-3 py-2 rounded-xl text-xs transition-all duration-200 text-left"
              style={{
                background: titleDetect === opt.id ? 'var(--bg-secondary)' : 'transparent',
                color: titleDetect === opt.id ? 'var(--text-primary)' : 'var(--text-muted)',
                border: titleDetect === opt.id ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
              }}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-[10px] mt-0.5 opacity-70">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* 手動填寫標題欄 */}
        {titleDetect === 'manual' && (
          <input
            type="text"
            value={manualTitle}
            onChange={(e) => onManualTitleChange(e.target.value)}
            placeholder="輸入你的標題..."
            className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              '--tw-ring-color': 'var(--accent-primary)',
            }}
          />
        )}
      </div>

      {/* 雜誌感模式額外選項 */}
      {mode === 'theater' && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* 標題樣式 */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>標題樣式</span>
            <select
              value={titleStyle}
              onChange={(e) => onTitleStyleChange(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg outline-none"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              {TITLE_STYLE_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* 標點全形 */}
          <ToggleSwitch
            active={fullWidthPunctuation}
            onClick={onFullWidthPunctuationChange}
            label="標點全形"
          />

          {/* 句首大寫 */}
          <ToggleSwitch
            active={sentenceCase}
            onClick={onSentenceCaseChange}
            label="句首大寫"
          />

          {/* 數字全形 */}
          <ToggleSwitch
            active={fullWidthDigit}
            onClick={onFullWidthDigitChange}
            label="數字全形"
          />
        </div>
      )}

      {/* 驗證警告 */}
      {warnings && warnings.length > 0 && (
        <div className="mt-2 space-y-1">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                background: 'rgba(255, 200, 50, 0.1)',
                color: '#C8A020',
                border: '1px solid rgba(255, 200, 50, 0.2)',
              }}
            >
              ⚠ {w}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ToggleSwitch({ active, onClick, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 cursor-pointer">
      <div
        className="relative w-8 h-4 rounded-full transition-colors duration-200"
        style={{
          background: active
            ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
            : 'var(--border)',
        }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full transition-transform duration-200"
          style={{
            background: 'white',
            transform: active ? 'translateX(16px)' : 'translateX(2px)',
          }}
        />
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </button>
  )
}
