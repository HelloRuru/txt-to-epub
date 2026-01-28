import { useState } from 'react'
import { generateEpub } from '../utils/epubGenerator'
import { convertToTraditional } from '../utils/converter'
import { FONT_CONFIG } from '../utils/fontSubset'
import { useTheme } from '../contexts/ThemeContext'

export default function ExportButton({ content, chapters, cover, settings, onReset }) {
  const { isDark } = useTheme()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState({ stage: '', message: '' })

  const handleExport = async () => {
    setIsGenerating(true)
    setProgress({ stage: 'convert', message: '準備中...' })

    try {
      let processedChapters = chapters
      let processedTitle = settings.title

      if (settings.convertToTraditional) {
        setProgress({ stage: 'convert', message: '正在轉換簡體為繁體...' })
        processedChapters = await Promise.all(
          chapters.map(async (ch) => ({
            ...ch,
            title: await convertToTraditional(ch.title),
            content: await convertToTraditional(ch.content),
          }))
        )
        processedTitle = await convertToTraditional(settings.title)
      }

      await generateEpub({
        title: processedTitle,
        author: settings.author,
        chapters: processedChapters,
        cover,
        writingMode: settings.writingMode,
        fontFamily: settings.fontFamily,
        embedFont: settings.embedFont,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
        textIndent: settings.textIndent,
        onProgress: setProgress,
      })

      setIsComplete(true)
    } catch (error) {
      console.error('生成失敗:', error)
      alert(`生成失敗：${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const fontConfig = FONT_CONFIG[settings.fontFamily]

  if (isComplete) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className={`text-2xl mb-4 ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
          EPUB 生成完成！
        </h2>
        <p className={`mb-8 ${isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-500/80'}`}>
          檔案已自動下載到你的裝置 ♡
        </p>
        <button
          onClick={onReset}
          className="px-8 py-3 rounded-xl bg-nadeshiko-400 text-white hover:bg-nadeshiko-500 transition-colors btn-press"
        >
          轉換另一個檔案
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <h2 className={`text-2xl mb-2 ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
        確認並輸出
      </h2>
      <div className="decorative-line mb-6"></div>
      
      {/* 摘要 */}
      <div className={`max-w-md mx-auto mb-8 p-6 rounded-xl text-left space-y-3 ${
        isDark ? 'bg-nadeshiko-900/10' : 'bg-nadeshiko-50/80'
      }`}>
        {[
          { label: '書名', value: settings.title || '未命名' },
          { label: '作者', value: settings.author || '未填寫' },
          { label: '章節數', value: `${chapters.length} 章` },
          { label: '封面', value: cover ? '已設定' : '無' },
          { label: '簡轉繁', value: settings.convertToTraditional ? '是' : '否' },
          { label: '排版', value: settings.writingMode === 'vertical' ? '直排' : '橫排' },
          { label: '字型', value: fontConfig?.name || '預設' },
          { label: '嵌入字型', value: settings.embedFont ? '是（子集化）' : '否' },
        ].map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className={isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-500/80'}>
              {item.label}
            </span>
            <span className={isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* 進度顯示 */}
      {isGenerating && (
        <div className={`max-w-md mx-auto mb-6 p-4 rounded-xl text-left ${
          isDark ? 'bg-nadeshiko-900/20' : 'bg-nadeshiko-100/80'
        }`}>
          <div className="flex items-center gap-3">
            <span className="animate-spin text-xl">⏳</span>
            <span className={isDark ? 'text-nadeshiko-300' : 'text-nadeshiko-600'}>
              {progress.message || '處理中...'}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isGenerating}
        className={`px-12 py-4 rounded-xl text-lg font-medium transition-all btn-press ${
          isGenerating
            ? isDark 
              ? 'bg-dark-border text-nadeshiko-600 cursor-wait'
              : 'bg-nadeshiko-200 text-nadeshiko-400 cursor-wait'
            : 'bg-nadeshiko-400 text-white hover:bg-nadeshiko-500 hover:scale-105 shadow-soft'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            生成中...
          </span>
        ) : (
          '📥 下載 EPUB'
        )}
      </button>

      <p className={`text-sm mt-4 ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
        輸出檔名：{settings.title || '未命名'}.epub
      </p>

      {settings.embedFont && (
        <p className={`text-xs mt-2 ${isDark ? 'text-nadeshiko-600' : 'text-nadeshiko-300'}`}>
          ⚡ 首次嵌入字型需下載完整字型檔，之後會快取加速
        </p>
      )}
    </div>
  )
}
