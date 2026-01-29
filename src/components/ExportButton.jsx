import { useState } from 'react'
import { generateEpub } from '../utils/epubGenerator'
import { convertToTraditional } from '../utils/converter'
import { FONT_CONFIG } from '../utils/fontSubset'
import { generateFilename } from '../utils/filenameFormat'

// SVG Icons
const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-16 h-16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const LoaderIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 animate-spin" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
)

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

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

      let processedAuthor = settings.author
      if (settings.convertToTraditional && settings.author) {
        processedAuthor = await convertToTraditional(settings.author)
      }
      
      const outputFilename = generateFilename({
        title: processedTitle,
        author: processedAuthor,
        format: settings.filenameFormat || 'title-author',
        includeDate: settings.filenameIncludeDate || false,
        customTemplate: settings.filenameCustomTemplate || '',
      })

      await generateEpub({
        title: processedTitle,
        author: processedAuthor,
        chapters: processedChapters,
        cover,
        writingMode: settings.writingMode,
        fontFamily: settings.fontFamily,
        embedFont: settings.embedFont,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
        textIndent: settings.textIndent,
        filename: outputFilename,
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
        <div 
          className="inline-flex mb-6"
          style={{ color: 'var(--accent-primary)' }}
        >
          <CheckCircleIcon />
        </div>
        <h2 
          className="font-serif text-2xl font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          EPUB 生成完成！
        </h2>
        <p 
          className="mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          檔案已自動下載到你的裝置
        </p>
        <button
          onClick={onReset}
          className="px-8 py-3 rounded-full text-sm font-medium transition-all"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
            boxShadow: '0 4px 16px rgba(212, 165, 165, 0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          轉換另一個檔案
        </button>
      </div>
    )
  }

  const summaryItems = [
    { label: '書名', value: settings.title || '未命名' },
    { label: '作者', value: settings.author || '未填寫' },
    { label: '章節數', value: `${chapters.length} 章` },
    { label: '封面', value: cover ? '已設定' : '無' },
    { label: '簡轉繁', value: settings.convertToTraditional ? '是' : '否' },
    { label: '排版', value: settings.writingMode === 'vertical' ? '直排' : '橫排' },
    { label: '字型', value: fontConfig?.name || '預設' },
    { label: '嵌入字型', value: settings.embedFont ? '是（子集化）' : '否' },
  ]

  return (
    <div className="text-center py-8">
      <h2 
        className="font-serif text-2xl font-semibold mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        確認並輸出
      </h2>
      
      {/* Summary */}
      <div 
        className="max-w-md mx-auto mb-8 p-6 rounded-2xl text-left space-y-3"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {summaryItems.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>
              {item.label}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Progress */}
      {isGenerating && (
        <div 
          className="max-w-md mx-auto mb-6 p-4 rounded-2xl text-left"
          style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="flex items-center gap-3">
            <LoaderIcon style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {progress.message || '處理中...'}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isGenerating}
        className="px-12 py-4 rounded-full text-lg font-medium transition-all flex items-center gap-3 mx-auto"
        style={{ 
          background: isGenerating 
            ? 'var(--bg-secondary)' 
            : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          color: isGenerating ? 'var(--text-muted)' : 'white',
          cursor: isGenerating ? 'wait' : 'pointer',
          boxShadow: isGenerating ? 'none' : '0 4px 16px rgba(212, 165, 165, 0.3)'
        }}
        onMouseEnter={(e) => {
          if (!isGenerating) e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {isGenerating ? (
          <>
            <LoaderIcon />
            生成中...
          </>
        ) : (
          <>
            <DownloadIcon />
            下載 EPUB
          </>
        )}
      </button>

      <p 
        className="text-sm mt-4"
        style={{ color: 'var(--text-muted)' }}
      >
        輸出檔名：{settings.title || '未命名'}.epub
      </p>

      {settings.embedFont && (
        <p 
          className="text-xs mt-3 flex items-center justify-center gap-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <ZapIcon style={{ color: 'var(--accent-secondary)' }} />
          首次嵌入字型需下載完整字型檔，之後會快取加速
        </p>
      )}
    </div>
  )
}
