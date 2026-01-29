// SVG Icons
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

export default function ChapterPreview({ chapters, setChapters, fileName }) {
  const handleTitleChange = (index, newTitle) => {
    const updated = [...chapters]
    updated[index].title = newTitle
    setChapters(updated)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 
          className="font-serif text-2xl font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          章節預覽
        </h2>
        <p 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          已從「{fileName}」偵測到 {chapters.length} 個章節，可點擊標題編輯
        </p>
      </div>

      {chapters.length === 0 ? (
        <div 
          className="text-center py-12"
          style={{ color: 'var(--text-muted)' }}
        >
          <div 
            className="inline-flex mb-4"
            style={{ color: 'var(--accent-primary)' }}
          >
            <SearchIcon />
          </div>
          <p>未偵測到章節，整份文件將作為單一章節處理</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {chapters.map((chapter, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all"
              style={{ background: 'var(--bg-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 165, 165, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
            >
              <span 
                className="text-sm w-8 text-right font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {index + 1}
              </span>
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none rounded px-2 py-1 font-serif"
                style={{ 
                  color: 'var(--text-primary)',
                  caretColor: 'var(--accent-primary)'
                }}
              />
              <span 
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {chapter.content.length.toLocaleString()} 字
              </span>
            </div>
          ))}
        </div>
      )}

      <div 
        className="p-4 rounded-2xl text-sm flex items-start gap-3"
        style={{ 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)'
        }}
      >
        <InfoIcon style={{ color: 'var(--accent-secondary)', flexShrink: 0, marginTop: '2px' }} />
        <span>
          自動偵測格式：第X章、Chapter X、數字編號等。如有遺漏可在下一步手動調整。
        </span>
      </div>
    </div>
  )
}
