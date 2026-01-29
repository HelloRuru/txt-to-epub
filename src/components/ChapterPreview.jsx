import { useState } from 'react'
import { splitBySeparator, splitByEmptyLines, splitByCharCount, splitAsSingleChapter } from '../utils/chapterDetector'

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

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="w-12 h-12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const ScissorsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="6" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
)

export default function ChapterPreview({ chapters, setChapters, fileName, rawContent }) {
  const [splitMethod, setSplitMethod] = useState(null)
  const [customSeparator, setCustomSeparator] = useState('===')
  const [charCount, setCharCount] = useState(5000)

  const handleTitleChange = (index, newTitle) => {
    const updated = [...chapters]
    updated[index].title = newTitle
    setChapters(updated)
  }

  // 應用分章方法
  const applySplitMethod = (method) => {
    let result = null
    
    switch (method) {
      case 'separator':
        result = splitBySeparator(rawContent, customSeparator)
        break
      case 'emptyLines':
        result = splitByEmptyLines(rawContent, 3)
        break
      case 'charCount':
        result = splitByCharCount(rawContent, charCount)
        break
      case 'single':
        result = splitAsSingleChapter(rawContent)
        break
    }

    if (result) {
      setChapters(result)
      setSplitMethod(null)
    } else {
      alert('此方法無法有效分章，請嘗試其他方式')
    }
  }

  // 如果沒有偵測到章節（chapters 為 null 或只有一個「全文」章節）
  const needsManualSplit = !chapters || chapters.length === 0 || 
    (chapters.length === 1 && chapters[0].title === '全文')

  // 手動分章選項 UI
  const ManualSplitOptions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div 
          className="inline-flex mb-4"
          style={{ color: 'var(--accent-secondary)' }}
        >
          <AlertIcon />
        </div>
        <h3 
          className="font-serif text-xl font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          未偵測到章節標題
        </h3>
        <p 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          請選擇分章方式，讓電子書有完整的目錄結構
        </p>
      </div>

      <div className="grid gap-3">
        {/* 依分隔符號 */}
        <div 
          className="p-4 rounded-2xl border transition-all cursor-pointer"
          style={{ 
            borderColor: splitMethod === 'separator' ? 'var(--accent-primary)' : 'var(--border)',
            background: splitMethod === 'separator' ? 'rgba(212, 165, 165, 0.1)' : 'var(--bg-secondary)'
          }}
          onClick={() => setSplitMethod('separator')}
        >
          <div className="flex items-center gap-3 mb-2">
            <ScissorsIcon style={{ color: 'var(--accent-primary)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              依分隔符號
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            文本中有 ===、---、*** 等分隔線
          </p>
          {splitMethod === 'separator' && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customSeparator}
                onChange={(e) => setCustomSeparator(e.target.value)}
                placeholder="輸入分隔符號"
                className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  applySplitMethod('separator')
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: 'white'
                }}
              >
                套用
              </button>
            </div>
          )}
        </div>

        {/* 依空行 */}
        <div 
          className="p-4 rounded-2xl border transition-all cursor-pointer"
          style={{ 
            borderColor: 'var(--border)',
            background: 'var(--bg-secondary)'
          }}
          onClick={() => applySplitMethod('emptyLines')}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div className="flex items-center gap-3 mb-2">
            <ScissorsIcon style={{ color: 'var(--accent-secondary)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              依空行分章
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            連續 3 個以上空行視為章節分隔
          </p>
        </div>

        {/* 依字數 */}
        <div 
          className="p-4 rounded-2xl border transition-all cursor-pointer"
          style={{ 
            borderColor: splitMethod === 'charCount' ? 'var(--accent-primary)' : 'var(--border)',
            background: splitMethod === 'charCount' ? 'rgba(212, 165, 165, 0.1)' : 'var(--bg-secondary)'
          }}
          onClick={() => setSplitMethod('charCount')}
        >
          <div className="flex items-center gap-3 mb-2">
            <ScissorsIcon style={{ color: 'var(--lavender)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              依字數分章
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            每隔固定字數自動切分
          </p>
          {splitMethod === 'charCount' && (
            <div className="flex gap-2 mt-3">
              <select
                value={charCount}
                onChange={(e) => setCharCount(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value={3000}>每 3,000 字</option>
                <option value={5000}>每 5,000 字</option>
                <option value={10000}>每 10,000 字</option>
                <option value={20000}>每 20,000 字</option>
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  applySplitMethod('charCount')
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: 'white'
                }}
              >
                套用
              </button>
            </div>
          )}
        </div>

        {/* 不分章 */}
        <div 
          className="p-4 rounded-2xl border transition-all cursor-pointer"
          style={{ 
            borderColor: 'var(--border)',
            background: 'var(--bg-secondary)'
          }}
          onClick={() => applySplitMethod('single')}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">📄</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              不分章（全文作為單一章節）
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            適合短篇或不需要目錄的文本
          </p>
        </div>
      </div>
    </div>
  )

  // 章節列表 UI
  const ChapterList = () => (
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

  return needsManualSplit ? <ManualSplitOptions /> : <ChapterList />
}
