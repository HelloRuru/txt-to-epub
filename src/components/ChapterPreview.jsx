export default function ChapterPreview({ chapters, setChapters, fileName }) {
  const handleTitleChange = (index, newTitle) => {
    const updated = [...chapters]
    updated[index].title = newTitle
    setChapters(updated)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="font-serif text-2xl text-cream mb-2">章節預覽</h2>
        <p className="text-warm-400/80 text-sm">
          已從「{fileName}」偵測到 {chapters.length} 個章節，可點擊標題編輯
        </p>
      </div>

      {chapters.length === 0 ? (
        <div className="text-center py-12 text-warm-400/60">
          <p className="text-4xl mb-4">🔍</p>
          <p>未偵測到章節，整份文件將作為單一章節處理</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {chapters.map((chapter, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 p-3 rounded-xl bg-warm-700/10 hover:bg-warm-700/20 transition-colors"
            >
              <span className="text-warm-400/50 text-sm w-8 text-right">
                {index + 1}
              </span>
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                className="flex-1 bg-transparent border-none text-cream focus:outline-none focus:ring-1 focus:ring-warm-500/50 rounded px-2 py-1"
              />
              <span className="text-warm-400/40 text-xs">
                {chapter.content.length.toLocaleString()} 字
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 rounded-xl bg-warm-700/10 text-warm-400/80 text-sm">
        <p className="flex items-start gap-2">
          <span>💡</span>
          <span>
            自動偵測格式：第X章、Chapter X、數字編號等。如有遺漏可在下一步手動調整。
          </span>
        </p>
      </div>
    </div>
  )
}
