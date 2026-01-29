import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { detectChapters, analyzeText, DETECTION_MODES } from '../utils/chapterDetector'

export default function ChapterPreview({ chapters, setChapters, fileName, content }) {
  const { isDark } = useTheme()
  const [detectionMode, setDetectionMode] = useState(DETECTION_MODES.AUTO)
  const [analysis, setAnalysis] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [separator, setSeparator] = useState('===')
  const [separatorInput, setSeparatorInput] = useState('===')

  // 分析文字內容
  useEffect(() => {
    if (content) {
      const result = analyzeText(content)
      setAnalysis(result)
      // 如果系統偵測到的章節少於 2 個，顯示分析提示
      if (chapters.length <= 1 && result.recommendation !== DETECTION_MODES.AUTO) {
        setShowAnalysis(true)
      }
      // 如果偵測到常見分隔符號，自動填入第一個
      if (result.commonSeparators.length > 0) {
        setSeparator(result.commonSeparators[0].name)
        setSeparatorInput(result.commonSeparators[0].name)
      }
    }
  }, [content, chapters.length])

  // 切換偵測模式
  const handleModeChange = (mode) => {
    setDetectionMode(mode)
    if (mode === DETECTION_MODES.BY_SEPARATOR) {
      const newChapters = detectChapters(content, mode, { separator })
      setChapters(newChapters)
    } else {
      const newChapters = detectChapters(content, mode)
      setChapters(newChapters)
    }
  }

  // 套用分隔符號
  const handleApplySeparator = () => {
    if (!separatorInput.trim()) return
    setSeparator(separatorInput.trim())
    const newChapters = detectChapters(content, DETECTION_MODES.BY_SEPARATOR, { 
      separator: separatorInput.trim() 
    })
    setChapters(newChapters)
  }

  const handleTitleChange = (index, newTitle) => {
    const updated = [...chapters]
    updated[index].title = newTitle
    setChapters(updated)
  }

  // 取得模式說明
  const getModeDescription = (mode) => {
    switch (mode) {
      case DETECTION_MODES.AUTO:
        return '依規則偵測（第X章、[數字]、Chapter 等格式）'
      case DETECTION_MODES.BY_EMPTY_LINES:
        return '以連續空行作為章節分隔'
      case DETECTION_MODES.BY_SEPARATOR:
        return '以自訂符號作為章節分隔'
      case DETECTION_MODES.SINGLE_CHAPTER:
        return '不分章，整份文件為單一章節'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className={`text-2xl mb-2 ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
          章節預覽
        </h2>
        <div className="decorative-line mb-3"></div>
        <p className={`text-sm ${isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-500/80'}`}>
          已從「{fileName}」偵測到 {chapters.length} 個章節 ✿
        </p>
      </div>

      {/* 偵測模式選擇 */}
      <div className={`p-4 rounded-xl ${
        isDark ? 'bg-nadeshiko-900/10' : 'bg-nadeshiko-50'
      }`}>
        <p className={`text-sm font-medium mb-3 ${
          isDark ? 'text-nadeshiko-300' : 'text-nadeshiko-700'
        }`}>
          📚 分章方式
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { mode: DETECTION_MODES.AUTO, label: '系統偵測', icon: '🔍' },
            { mode: DETECTION_MODES.BY_EMPTY_LINES, label: '依空行分章', icon: '📄' },
            { mode: DETECTION_MODES.BY_SEPARATOR, label: '依分隔符號', icon: '✂️' },
            { mode: DETECTION_MODES.SINGLE_CHAPTER, label: '不分章', icon: '📃' },
          ].map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                detectionMode === mode
                  ? 'bg-nadeshiko-400 text-white shadow-soft'
                  : isDark
                    ? 'bg-dark-border text-nadeshiko-300 hover:bg-nadeshiko-700/30'
                    : 'bg-white text-nadeshiko-600 hover:bg-nadeshiko-100 border border-nadeshiko-200'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <p className={`text-xs mt-2 ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
          {getModeDescription(detectionMode)}
        </p>

        {/* 分隔符號輸入 */}
        {detectionMode === DETECTION_MODES.BY_SEPARATOR && (
          <div className="mt-4 pt-4 border-t border-nadeshiko-200/30">
            <div className="flex items-center gap-3">
              <label className={`text-sm ${isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-600'}`}>
                分隔符號：
              </label>
              <input
                type="text"
                value={separatorInput}
                onChange={(e) => setSeparatorInput(e.target.value)}
                placeholder="如 ===、---、***"
                className={`flex-1 max-w-xs px-3 py-2 rounded-lg text-sm border transition-colors ${
                  isDark 
                    ? 'bg-dark-border border-dark-border text-nadeshiko-200 placeholder:text-nadeshiko-600 focus:border-nadeshiko-500' 
                    : 'bg-white border-nadeshiko-200 text-nadeshiko-800 placeholder:text-nadeshiko-400 focus:border-nadeshiko-400'
                } focus:outline-none`}
              />
              <button
                onClick={handleApplySeparator}
                className="px-4 py-2 rounded-lg text-sm bg-nadeshiko-400 text-white hover:bg-nadeshiko-500 transition-colors"
              >
                套用
              </button>
            </div>
            
            {/* 偵測到的分隔符號提示 */}
            {analysis?.commonSeparators?.length > 0 && (
              <div className={`mt-3 text-xs ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
                <span>偵測到的分隔符號：</span>
                {analysis.commonSeparators.map((sep, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSeparatorInput(sep.name)
                      setSeparator(sep.name)
                      const newChapters = detectChapters(content, DETECTION_MODES.BY_SEPARATOR, { 
                        separator: sep.name 
                      })
                      setChapters(newChapters)
                    }}
                    className={`ml-2 px-2 py-0.5 rounded ${
                      isDark 
                        ? 'bg-nadeshiko-800/30 hover:bg-nadeshiko-700/30' 
                        : 'bg-nadeshiko-100 hover:bg-nadeshiko-200'
                    }`}
                  >
                    {sep.name}（{sep.count}）
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 分析建議提示 */}
      {showAnalysis && analysis && (
        <div className={`p-4 rounded-xl border-2 border-dashed ${
          isDark 
            ? 'bg-amber-900/10 border-amber-600/30' 
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <p className={`font-medium mb-2 ${
                isDark ? 'text-amber-300' : 'text-amber-700'
              }`}>
                偵測建議
              </p>
              <div className={`text-sm space-y-1 ${
                isDark ? 'text-amber-400/80' : 'text-amber-600'
              }`}>
                {analysis.detectedPatterns.length > 0 ? (
                  <p>偵測到格式：{analysis.detectedPatterns.join('、')}</p>
                ) : (
                  <p>未偵測到明確的章節格式標記</p>
                )}
                
                {analysis.recommendation === DETECTION_MODES.BY_EMPTY_LINES && (
                  <p className="mt-2">
                    📌 建議嘗試「<button 
                      onClick={() => handleModeChange(DETECTION_MODES.BY_EMPTY_LINES)}
                      className="underline font-medium hover:text-amber-500"
                    >依空行分章</button>」— 偵測到約 {analysis.emptyLineBlocks} 個段落區塊
                  </p>
                )}

                {analysis.commonSeparators.length > 0 && (
                  <p className="mt-2">
                    📌 偵測到分隔符號：{analysis.commonSeparators.map(s => `${s.name}（${s.count}處）`).join('、')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowAnalysis(false)}
                className={`text-xs mt-3 ${
                  isDark ? 'text-nadeshiko-500 hover:text-nadeshiko-400' : 'text-nadeshiko-400 hover:text-nadeshiko-500'
                }`}
              >
                隱藏提示
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 章節列表 */}
      {chapters.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
          <p className="text-4xl mb-4">🔍</p>
          <p>未偵測到章節，請嘗試其他分章方式</p>
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
              <span className={`text-sm w-8 text-right shrink-0 ${
                isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'
              }`}>
                {index + 1}
              </span>
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-nadeshiko-400/50 rounded px-2 py-1 min-w-0 ${
                  isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-800'
                }`}
              />
              <span className={`text-xs shrink-0 ${isDark ? 'text-nadeshiko-600' : 'text-nadeshiko-400'}`}>
                {chapter.content.length.toLocaleString()} 字
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 說明提示 */}
      <div className={`p-4 rounded-xl text-sm ${
        isDark 
          ? 'bg-nadeshiko-900/10 text-nadeshiko-400/80' 
          : 'bg-nadeshiko-50 text-nadeshiko-600/80'
      }`}>
        <p className="flex items-start gap-2">
          <span>✏️</span>
          <span>
            可點擊章節標題直接編輯。支援偵測格式：第X章、[數字]、Chapter X、數字編號、自訂分隔符號等。
          </span>
        </p>
      </div>
    </div>
  )
}
