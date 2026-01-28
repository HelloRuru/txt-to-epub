import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { convertToTraditional } from '../utils/converter'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'

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

      // 找出需要轉換的文字檔案
      const textExtensions = ['.xhtml', '.html', '.htm', '.xml', '.ncx', '.opf']
      
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue

        const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
        
        if (textExtensions.includes(ext)) {
          setProgress({ 
            stage: `轉換中：${filename.split('/').pop()}`, 
            percent: 10 + Math.floor((processedFiles / totalFiles) * 80) 
          })

          const content = await zipEntry.async('string')
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

      // 生成新的 EPUB
      const newEpub = await zip.generateAsync({ 
        type: 'blob',
        mimeType: 'application/epub+zip',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      })

      // 下載
      const newFileName = file.name.replace(/\.epub$/i, '_繁體.epub')
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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-dark-bg to-dark-card' 
        : 'bg-gradient-to-b from-nadeshiko-50 to-nadeshiko-100'
    }`}>
      {/* 頂部導航 */}
      <nav className={`border-b sticky top-0 z-10 backdrop-blur-sm transition-colors ${
        isDark 
          ? 'border-dark-border bg-dark-bg/80' 
          : 'border-nadeshiko-200 bg-nadeshiko-50/80'
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to="/" 
            className={`flex items-center gap-2 transition-colors ${
              isDark 
                ? 'text-nadeshiko-300 hover:text-nadeshiko-200' 
                : 'text-nadeshiko-600 hover:text-nadeshiko-700'
            }`}
          >
            <span>←</span>
            <span>返回工具箱</span>
          </Link>
          
          <h1 className={`text-xl font-medium ${
            isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-800'
          }`}>
            ✿ EPUB 簡轉繁
          </h1>
          
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 使用說明 */}
        <div className={`mb-8 p-6 rounded-2xl border transition-colors ${
          isDark 
            ? 'bg-dark-card border-dark-border' 
            : 'bg-white/70 border-nadeshiko-200'
        }`}>
          <h2 className={`text-xl mb-2 flex items-center gap-2 ${
            isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
          }`}>
            <span>🔄</span> 使用說明
          </h2>
          <div className="decorative-line mb-4"></div>
          
          <div className={`space-y-2 text-sm ${
            isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-600/80'
          }`}>
            <p>• 上傳簡體中文的 EPUB 電子書，自動轉換為繁體中文</p>
            <p>• 使用 OpenCC 繁化姬引擎，包含詞彙轉換（如「軟件」→「軟體」）</p>
            <p>• 全程本機處理，檔案不會上傳到伺服器</p>
            <p>• 無檔案大小限制 ♡</p>
          </div>
        </div>

        {/* 主要內容區 */}
        <div className={`rounded-2xl border p-6 md:p-8 transition-colors ${
          isDark 
            ? 'bg-dark-card border-dark-border' 
            : 'bg-white/80 border-nadeshiko-200 shadow-soft'
        }`}>
          
          {isComplete ? (
            // 完成畫面
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className={`text-2xl mb-4 ${
                isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
              }`}>
                轉換完成！
              </h2>
              <p className={`mb-2 ${
                isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-500'
              }`}>
                檔案已自動下載 ♡
              </p>
              <p className={`text-sm mb-8 ${
                isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'
              }`}>
                共轉換 {stats.files} 個檔案，約 {(stats.chars / 10000).toFixed(1)} 萬字
              </p>
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-xl bg-nadeshiko-400 text-white hover:bg-nadeshiko-500 transition-colors btn-press"
              >
                轉換另一個檔案
              </button>
            </div>
          ) : !file ? (
            // 上傳區
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className={`text-2xl mb-2 ${
                  isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
                }`}>
                  上傳 EPUB 檔案
                </h2>
                <div className="decorative-line"></div>
              </div>

              <label
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                className={`
                  block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                  transition-all duration-300 card-hover
                  ${isDragging 
                    ? 'border-nadeshiko-400 bg-nadeshiko-400/10' 
                    : isDark
                      ? 'border-dark-border hover:border-nadeshiko-600 hover:bg-nadeshiko-900/10'
                      : 'border-nadeshiko-300 hover:border-nadeshiko-400 hover:bg-nadeshiko-100/50'
                  }
                `}
              >
                <input
                  type="file"
                  accept=".epub"
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <div className="text-5xl mb-4">📚</div>
                <p className={`font-medium mb-2 ${
                  isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
                }`}>
                  {isDragging ? '放開以上傳 ✿' : '拖放 EPUB 到這裡'}
                </p>
                <p className={isDark ? 'text-nadeshiko-400/60' : 'text-nadeshiko-500/60'}>
                  或點擊選擇檔案
                </p>
              </label>
            </div>
          ) : (
            // 確認與轉換
            <div className="space-y-6">
              <div className="text-center">
                <h2 className={`text-2xl mb-2 ${
                  isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
                }`}>
                  確認轉換
                </h2>
                <div className="decorative-line"></div>
              </div>

              {/* 檔案資訊 */}
              <div className={`p-4 rounded-xl flex items-center gap-4 ${
                isDark ? 'bg-nadeshiko-900/10' : 'bg-nadeshiko-50'
              }`}>
                <span className="text-3xl">📚</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
                  }`}>
                    {file.name}
                  </p>
                  <p className={`text-sm ${
                    isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-500'
                  }`}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-nadeshiko-400 hover:bg-dark-border' 
                      : 'text-nadeshiko-500 hover:bg-nadeshiko-100'
                  }`}
                >
                  移除
                </button>
              </div>

              {/* 進度條 */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className={`h-2 rounded-full overflow-hidden ${
                    isDark ? 'bg-dark-border' : 'bg-nadeshiko-100'
                  }`}>
                    <div 
                      className="h-full bg-nadeshiko-400 transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <p className={`text-sm text-center ${
                    isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-500'
                  }`}>
                    {progress.stage}
                  </p>
                </div>
              )}

              {/* 按鈕 */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setFile(null)}
                  disabled={isProcessing}
                  className={`px-6 py-3 rounded-xl transition-colors btn-press ${
                    isDark 
                      ? 'bg-dark-border text-nadeshiko-300 hover:bg-nadeshiko-700/30' 
                      : 'bg-nadeshiko-100 text-nadeshiko-600 hover:bg-nadeshiko-200'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  取消
                </button>
                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className={`px-8 py-3 rounded-xl transition-colors btn-press ${
                    isProcessing 
                      ? 'bg-nadeshiko-300 text-white cursor-wait'
                      : 'bg-nadeshiko-400 text-white hover:bg-nadeshiko-500 shadow-soft'
                  }`}
                >
                  {isProcessing ? '轉換中...' : '🔄 開始轉換'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 底部 */}
      <footer className={`text-center py-6 text-xs ${
        isDark ? 'text-nadeshiko-700' : 'text-nadeshiko-400'
      }`}>
        <p>✿ HelloRuru-Tools ✿</p>
      </footer>
    </div>
  )
}
