import { useCallback } from 'react'

// 分隔線符號
const SEPARATORS = [
  { label: '───', value: '───────────────' },
  { label: '═══', value: '═══════════════' },
  { label: '◆◆◆', value: '◆ ◆ ◆' },
  { label: '✦✦✦', value: '✦ ✦ ✦' },
  { label: '・・・', value: '・・・・・' },
  { label: '▪▪▪', value: '▪ ▪ ▪ ▪ ▪' },
]

export default function PostEditor({ value, onChange, placeholder, textareaRef }) {
  const insertAtCursor = useCallback((insertText) => {
    const textarea = textareaRef?.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = value.slice(0, start)
    const after = value.slice(end)
    const newValue = before + insertText + after

    onChange(newValue)

    // 還原游標位置
    requestAnimationFrame(() => {
      const pos = start + insertText.length
      textarea.selectionStart = pos
      textarea.selectionEnd = pos
      textarea.focus()
    })
  }, [value, onChange, textareaRef])

  return (
    <div className="flex flex-col h-full">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '在這裡輸入或貼上你的貼文...'}
        className="flex-1 w-full resize-none p-4 rounded-2xl text-sm leading-relaxed outline-none transition-all duration-300 focus:ring-2"
        style={{
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          fontFamily: "'GenSenRounded', 'Noto Sans TC', sans-serif",
          fontWeight: 500,
          minHeight: '240px',
          '--tw-ring-color': 'var(--accent-primary)',
        }}
        spellCheck={false}
      />

      {/* 分隔線快捷列 */}
      <div className="mt-3">
        <div
          className="text-xs mb-1.5 font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          插入分隔線
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SEPARATORS.map((sep) => (
            <button
              key={sep.label}
              onClick={() => insertAtCursor('\n' + sep.value + '\n')}
              className="px-2.5 py-1 rounded-lg text-xs transition-all duration-200 hover:scale-105"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
              title={sep.value}
            >
              {sep.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
