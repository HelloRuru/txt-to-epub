/**
 * 智慧字數統計列 — 進度條 + 各平台專屬指標
 */

export default function StatsBar({ stats, statusColor, platform }) {
  if (!stats) return null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {/* 進度條 */}
      <div className="flex-1 min-w-[100px]">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(stats.charPercent, 100)}%`,
              background: statusColor,
            }}
          />
        </div>
      </div>

      {/* 數字 + 標籤 */}
      <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: statusColor, fontWeight: 600 }}>{stats.charCount.toLocaleString()}</span>
        <span>/ {stats.maxChars.toLocaleString()} 字</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{stats.lineCount} 行</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{stats.paragraphCount} 段</span>

        {stats.showMoreTriggered && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,165,50,0.1)', color: '#C8A020' }}>
            超過 5 行將折疊
          </span>
        )}

        {platform === 'instagram' && stats.hashtagCount > 0 && (
          <span
            className="px-2 py-0.5 rounded-full"
            style={{
              background: stats.hashtagOver ? 'rgba(232,85,85,0.1)' : 'rgba(168,181,160,0.15)',
              color: stats.hashtagOver ? '#E85555' : 'var(--sage)',
            }}
          >
            #{stats.hashtagCount}/{stats.hashtagLimit}
          </span>
        )}

        {stats.threadSplits && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(184,169,201,0.15)', color: 'var(--lavender)' }}>
            建議拆為 {stats.threadSplits.length} 則串文
          </span>
        )}
      </div>
    </div>
  )
}
