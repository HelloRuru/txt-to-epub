import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { convertToTraditional } from '../utils/converter'
import { detectEncoding } from '../utils/encodingDetector'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'
import { useTheme } from '../contexts/ThemeContext'

// SVG Icons
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const ConvertIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M12 3v18"/>
    <path d="M5 8l7-5 7 5"/>
    <path d="M8 14l4 4 4-4"/>
    <circle cx="5" cy="12" r="2"/>
    <circle cx="19" cy="12" r="2"/>
  </svg>
)

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-12 h-12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const FileIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-16 h-16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

export default function EpubConvert() {
  const { isDark } = useTheme()
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ stage: '', percent: 0 })
  const [isComplete, setIsComplete] = useState(false)
  const [stats, setStats] = useState({ files: 0, chars: 0 })

  const handleFile = useCallback(async (uploadedFile) => {
    if (!uploadedFile.name.toLowerCase().endsWith('.epub')) {
      alert('請上傳 .epub 格式的檔案')
      return
    }
    setFile(uploadedFile)
    setIsComplete(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleConvert = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress({ stage: '讀取 EPUB...', percent: 5 })

    try {
      const zip = await JSZip.loadAsync(file)
      const totalFiles = Object.keys(zip.files).length
      let processedFiles = 0
      let totalChars = 0
      let convertedCount = 0

      const textExtensions = ['.xhtml', '.html', '.htm', '.xml', '.ncx', '.opf']
      
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue

        const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
        
        if (textExtensions.includes(ext)) {
          setProgress({ 
            stage: `轉換中：${filename.split('/').pop()}`, 
            percent: 10 + Math.floor((processedFiles / totalFiles) * 80) 
          })

          const uint8Array = await zipEntry.async('uint8array')
          const encoding = detectEncoding(uint8Array)
          
          let content
          if (encoding === 'UTF-8') {
            content = new TextDecoder('utf-8').decode(uint8Array)
          } else if (encoding === 'GBK') {
            content = new TextDecoder('gbk').decode(uint8Array)
          } else if (encoding === 'Big5') {
            content = new TextDecoder('big5').decode(uint8Array)
          } else {
            content = new TextDecoder('utf-8').decode(uint8Array)
          }
          
          const converted = await convertToTraditional(content)
          
          if (converted !== content) {
            convertedCount++
            totalChars += content.length
          }
          
          zip.file(filename, converted)
        }
        
        processedFiles++
      }

      setProgress({ stage: '打包 EPUB...', percent: 95 })

      const newEpub = await zip.generateAsync({ 
        type: 'blob',
        mimeType: 'application/epub+zip',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      })

      const originalName = file.name.replace(/\.epub$/i, '')
      const convertedName = await convertToTraditional(originalName)
      const newFileName = `${convertedName}.epub`
      saveAs(newEpub, newFileName)

      setStats({ files: convertedCount, chars: totalChars })
      setIsComplete(true)
      setProgress({ stage: '完成！', percent: 100 })

    } catch (error) {
      console.error('轉換失敗:', error)
      alert(`轉換失敗：${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setIsComplete(false)
    setProgress({ stage: '', percent: 0 })
    setStats({ files: 0, chars: 0 })
  }

  const instructions = [
    '上傳簡體中文的 EPUB 電子書，自動轉換為繁體中文',
    '使用 OpenCC 繁化姬引擎，包含詞彙轉換（如「軟件」→「軟體」）',
    '全程本機處理，檔案不會上傳到伺服器',
    '無檔案大小限制'
  ]

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ 
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Header */}
      <nav 
        className="sticky top-0 z-10 backdrop-blur-md transition-colors"
        style={{ 
          borderBottom: '1px solid var(--border)',
          background: isDark ? 'rgba(30, 26, 29, 0.8)' : 'rgba(255, 252, 250, 0.8)'
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--accent-primary)' }}
          >
            <ArrowLeftIcon />
            <span>返回工具箱</span>
          </Link>
          
          <h1 
            className="font-serif text-xl font-semibold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <ConvertIcon style={{ color: 'var(--accent-secondary)' }} />
            EPUB 簡轉繁
          </h1>
          
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Instructions */}
        <div 
          className="mb-10 p-8 rounded-3xl transition-all"
          style={{ 
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <h2 
            className="font-serif text-xl font-semibold mb-6 flex items-center gap-3"
            style={{ color: 'var(--text-primary)' }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center icon-container lavender"
              style={{ color: 'var(--lavender)' }}
            >
              <ConvertIcon />
            </div>
            使用說明
          </h2>
          
          <div className="space-y-3">
            {instructions.map((item, i) => (
              <p 
                key={i} 
                className="flex items-start gap-3 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                  style={{ background: 'var(--accent-primary)' }}
                />
                {item}
              </p>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="rounded-3xl p-8 md:p-10 transition-all"
          style={{ 
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}
        >
          
          {isComplete ? (
            // Complete Screen
            <div className="text-center py-8">
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
                轉換完成！
              </h2>
              <p 
                className="mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                檔案已自動下載
              </p>
              <p 
                className="text-sm mb-8"
                style={{ color: 'var(--text-muted)' }}
              >
                共轉換 {stats.files} 個檔案，約 {(stats.chars / 10000).toFixed(1)} 萬字
              </p>
              <button
                onClick={handleReset}
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
          ) : !file ? (
            // Upload Area
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 
                  className="font-serif text-2xl font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  上傳 EPUB 檔案
                </h2>
                <p 
                  className="text-sm flex items-center justify-center gap-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ShieldIcon style={{ color: 'var(--accent-primary)' }} />
                  檔案不會上傳到伺服器，全程在你的瀏覽器處理
                </p>
              </div>

              <label
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                className="block border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300"
                style={{ 
                  borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border)',
                  background: isDragging ? 'rgba(212, 165, 165, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)'
                    e.currentTarget.style.background = 'rgba(212, 165, 165, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <input
                  type="file"
                  accept=".epub"
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <div 
                  className="inline-flex mb-4"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <UploadIcon />
                </div>
                <p 
                  className="font-serif font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isDragging ? '放開以上傳' : '拖放 EPUB 到這裡'}
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  或點擊選擇檔案
                </p>
              </label>
            </div>
          ) : (
            // Confirm & Convert
            <div className="space-y-6">
              <div className="text-center">
                <h2 
                  className="font-serif text-2xl font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  確認轉換
                </h2>
              </div>

              {/* File Info */}
              <div 
                className="p-5 rounded-2xl flex items-center gap-4"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div style={{ color: 'var(--accent-secondary)' }}>
                  <FileIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-serif font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {file.name}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ 
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-primary)'
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.background = 'var(--bg-card)'
                  }}
                >
                  <XIcon />
                </button>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-3">
                  <div 
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <div 
                      className="h-full transition-all duration-300 rounded-full"
                      style={{ 
                        width: `${progress.percent}%`,
                        background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))'
                      }}
                    />
                  </div>
                  <p 
                    className="text-sm text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {progress.stage}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 justify-center pt-2">
                <button
                  onClick={() => setFile(null)}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-full text-sm font-medium transition-all"
                  style={{ 
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    opacity: isProcessing ? 0.5 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="px-8 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2"
                  style={{ 
                    background: isProcessing 
                      ? 'var(--bg-secondary)' 
                      : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: isProcessing ? 'var(--text-muted)' : 'white',
                    cursor: isProcessing ? 'wait' : 'pointer',
                    boxShadow: isProcessing ? 'none' : '0 4px 16px rgba(212, 165, 165, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessing) e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <ConvertIcon />
                  {isProcessing ? '轉換中...' : '開始轉換'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
