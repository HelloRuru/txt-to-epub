import { useState } from 'react'
import { generateEpub } from '../utils/epubGenerator'
import { convertToTraditional } from '../utils/converter'
import { FONT_CONFIG } from '../utils/fontSubset'

export default function ExportButton({ content, chapters, cover, settings, onReset }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState({ stage: '', message: '' })

  const handleExport = async () => {
    setIsGenerating(true)
    setProgress({ stage: 'convert', message: '準備中...' })

    try {
      let processedChapters = chapters
      let processedTitle = settings.title

      // 簡轉繁
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

      // 生成 EPUB
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
        <h2 className="font-serif text-2xl text-cream mb-4">EPUB 生成完成！</h2>
        <p className="text-warm-400/80 mb-8">檔案已自動下載到你的裝置</p>
        <button
          onClick={onReset}
          className="px-8 py-3 rounded-xl bg-warm-500 text-cream hover:bg-warm-400 transition-colors"
        >
          轉換另一個檔案
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <h2 className="font-serif text-2xl text-cream mb-6">確認並輸出</h2>
      
      {/* 摘要 */}
      <div className="max-w-md mx-auto mb-8 p-6 rounded-xl bg-warm-700/10 text-left space-y-3">
        <div className="flex justify-between">
          <span className="text-warm-400/80">書名</span>
          <span className="text-cream">{settings.title || '未命名'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-400/80">作者</span>
          <span className="text-cream">{settings.author || '未填寫'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-400/80">章節數</span>
          <span className="text-cream">{chapters.length} 章</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-400/80">封面</span>
          <span className="text-cream">{cover ? '已設定' : '無'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-400/80">簡轉繁</span>
          <span className="text-cream">{settings.convertToTraditional ? '是' : '否'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-400/80">排版</span>
          <span className="text-cream">{settings.writingMode === 'vertical' ? '直排' : '橫排'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-400/80">字型</span>
          <span className="text-cream">{fontConfig?.name || '預設'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-400/80">嵌入字型</span>
          <span className="text-cream">{settings.embedFont ? '是（子集化）' : '否'}</span>
        </div>
      </div>

      {/* 進度顯示 */}
      {isGenerating && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-warm-700/20 text-left">
          <div className="flex items-center gap-3">
            <span className="animate-spin text-xl">⏳</span>
            <span className="text-warm-400">{progress.message || '處理中...'}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isGenerating}
        className={`px-12 py-4 rounded-xl text-lg font-medium transition-all ${
          isGenerating
            ? 'bg-warm-700/50 text-warm-400/50 cursor-wait'
            : 'bg-warm-500 text-cream hover:bg-warm-400 hover:scale-105'
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

      <p className="text-warm-400/50 text-sm mt-4">
        輸出檔名：{settings.title || '未命名'}.epub
      </p>

      {settings.embedFont && (
        <p className="text-warm-400/40 text-xs mt-2">
          ⚡ 首次嵌入字型需下載完整字型檔，之後會快取加速
        </p>
      )}
    </div>
  )
}
