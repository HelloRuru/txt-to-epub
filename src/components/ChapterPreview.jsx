import { useTheme } from '../contexts/ThemeContext'

export default function ChapterPreview({ chapters, setChapters, fileName }) {
  const { isDark } = useTheme()
  
  const handleTitleChange = (index, newTitle) => {
    const updated = [...chapters]
    updated[index].title = newTitle
    setChapters(updated)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className={`text-2xl mb-2 ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
          章節預覽
        </h2>
        <div className="decorative-line mb-3"></div>
        <p className={`text-sm ${isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-500/80'}`}>
          已從「{fileName}」偵測到 {chapters.length} 個章節，可點擊標題編輯 ✿
        </p>
      </div>

      {chapters.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
          <p className="text-4xl mb-4">🔍</p>
          <p>未偵測到章節，整份文件將作為單一章節處理</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {chapters.map((chapter, index) => (
            <div 
              key={index}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                isDark 
                  ? 'bg-nadeshiko-900/10 hover:bg-nadeshiko-900/20' 
                  : 'bg-nadeshiko-100/50 hover:bg-nadeshiko-100'
              }`}
            >
              <span className={`text-sm w-8 text-right ${
                isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'
              }`}>
                {index + 1}
              </span>
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-nadeshiko-400/50 rounded px-2 py-1 ${
                  isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-800'
                }`}
              />
              <span className={`text-xs ${isDark ? 'text-nadeshiko-600' : 'text-nadeshiko-400'}`}>
                {chapter.content.length.toLocaleString()} 字
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={`p-4 rounded-xl text-sm ${
        isDark 
          ? 'bg-nadeshiko-900/10 text-nadeshiko-400/80' 
          : 'bg-nadeshiko-50 text-nadeshiko-600/80'
      }`}>
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
