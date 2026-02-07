import { useState, useMemo } from 'react'

/**
 * 即時預覽組件 — 模擬各平台真實排版
 *
 * 使用 CSS Container Queries + 平台 UI 皮膚
 */

const DEVICES = [
  { id: 'ios', name: 'iOS', width: 390, desc: '較寬螢幕，SF 字體' },
  { id: 'android', name: 'Android', width: 360, desc: '較窄螢幕，Roboto 字體' },
  { id: 'desktop', name: '電腦', width: '100%', desc: '全寬顯示' },
]

export default function PostPreview({ text, platform }) {
  const [device, setDevice] = useState('ios')
  const [expanded, setExpanded] = useState(false)

  const deviceWidth = useMemo(() => {
    const d = DEVICES.find(d => d.id === device)
    return d ? d.width : '100%'
  }, [device])

  const previewLines = text ? text.split('\n') : []

  return (
    <div className="flex flex-col h-full">
      {/* 裝置切換 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          裝置
        </span>
        <div
          className="flex rounded-lg p-0.5"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
              style={{
                background: device === d.id ? 'var(--bg-card)' : 'transparent',
                color: device === d.id ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: device === d.id ? 'var(--shadow)' : 'none',
              }}
            >
              {d.id === 'ios' && '📱'}
              {d.id === 'android' && '📱'}
              {d.id === 'desktop' && '🖥'}
              {d.name}
            </button>
          ))}
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {DEVICES.find(d => d.id === device)?.desc}
        </span>
      </div>

      {/* 預覽容器 */}
      <div
        className="flex-1 overflow-auto rounded-2xl p-1"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="mx-auto transition-all duration-300"
          style={{ maxWidth: typeof deviceWidth === 'number' ? `${deviceWidth}px` : deviceWidth }}
        >
          {platform === 'facebook' && (
            <FacebookPreview
              text={text}
              lines={previewLines}
              expanded={expanded}
              onToggle={() => setExpanded(!expanded)}
            />
          )}
          {platform === 'instagram' && (
            <InstagramPreview
              text={text}
              lines={previewLines}
              expanded={expanded}
              onToggle={() => setExpanded(!expanded)}
            />
          )}
          {platform === 'threads' && (
            <ThreadsPreview text={text} lines={previewLines} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Facebook 模擬 ─────────────────────────────────────

function FacebookPreview({ text, lines, expanded, onToggle }) {
  const showMore = lines.length > 5 && !expanded
  const visibleText = showMore ? lines.slice(0, 5).join('\n') : text

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
      {/* 頭部 */}
      <div className="flex items-center gap-2.5 p-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
          }}
        >
          R
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            HelloRuru
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            剛剛 · 🌐
          </div>
        </div>
      </div>

      {/* 內容 */}
      <div
        className="px-3 pb-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
        style={{
          color: 'var(--text-primary)',
          fontFamily: '-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif',
        }}
      >
        {visibleText || <span style={{ color: 'var(--text-muted)' }}>預覽將在這裡顯示...</span>}
        {showMore && (
          <span
            onClick={onToggle}
            className="cursor-pointer ml-1"
            style={{ color: 'var(--text-muted)' }}
          >
            ... 顯示更多
          </span>
        )}
      </div>

      {/* 底部互動列 */}
      <div
        className="flex justify-around py-2 mx-3 text-xs"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <span>👍 讚</span>
        <span>💬 留言</span>
        <span>↗️ 分享</span>
      </div>
    </div>
  )
}

// ─── Instagram 模擬 ────────────────────────────────────

function InstagramPreview({ text, lines, expanded, onToggle }) {
  const showMore = text && text.length > 125 && !expanded
  const visibleText = showMore ? text.slice(0, 125) : text

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
      {/* 圖片區域（模擬灰色佔位） */}
      <div
        className="w-full aspect-square flex items-center justify-center"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          📷 圖片區域
        </span>
      </div>

      {/* 互動列 */}
      <div className="flex gap-4 p-3 text-sm" style={{ color: 'var(--text-primary)' }}>
        <span>♡</span>
        <span>💬</span>
        <span>↗️</span>
      </div>

      {/* Caption */}
      <div
        className="px-3 pb-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="font-semibold mr-1.5">helloruru</span>
        {visibleText || <span style={{ color: 'var(--text-muted)' }}>caption 預覽...</span>}
        {showMore && (
          <span
            onClick={onToggle}
            className="cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            ...more
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Threads 模擬 ──────────────────────────────────────

function ThreadsPreview({ text, lines }) {
  return (
    <div className="rounded-xl overflow-hidden p-3" style={{ background: 'var(--bg-card)' }}>
      <div className="flex gap-2.5">
        <div className="flex flex-col items-center">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              color: 'white',
            }}
          >
            R
          </div>
          <div
            className="w-0.5 flex-1 mt-1 rounded-full"
            style={{ background: 'var(--border)' }}
          />
        </div>
        <div className="flex-1 pb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              helloruru
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>3分鐘前</span>
          </div>
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{ color: 'var(--text-primary)' }}
          >
            {text || <span style={{ color: 'var(--text-muted)' }}>串文預覽...</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

