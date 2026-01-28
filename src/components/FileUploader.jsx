import { useCallback, useState } from 'react'
import { readFileWithAutoEncoding } from '../utils/encodingDetector'
import { useTheme } from '../contexts/ThemeContext'

export default function FileUploader({ onUpload }) {
  const { isDark } = useTheme()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [encodingInfo, setEncodingInfo] = useState(null)

  const handleFile = useCallback(async (file) => {
    setError('')
    setEncodingInfo(null)
    
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('請上傳 .txt 格式的檔案')
      return
    }

    setLoading(true)

    try {
      const { text, encoding, encodingLabel } = await readFileWithAutoEncoding(file)
      setEncodingInfo({ encoding, label: encodingLabel })
      onUpload(file, text)
    } catch (err) {
      console.error('檔案讀取失敗:', err)
      setError('檔案讀取失敗，請確認檔案格式')
    } finally {
      setLoading(false)
    }
  }, [onUpload])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className={`text-2xl mb-2 ${
          isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
        }`}>
          上傳你的 TXT 檔案
        </h2>
        <div className="decorative-line mb-3"></div>
        <p className={`text-sm ${
          isDark ? 'text-nadeshiko-400/70' : 'text-nadeshiko-500/80'
        }`}>
          檔案不會上傳到伺服器，全程在你的瀏覽器處理 ♡
        </p>
      </div>

      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 card-hover
          ${isDragging 
            ? 'border-nadeshiko-400 bg-nadeshiko-400/10' 
            : isDark
              ? 'border-dark-border hover:border-nadeshiko-600 hover:bg-nadeshiko-900/10'
              : 'border-nadeshiko-300 hover:border-nadeshiko-400 hover:bg-nadeshiko-100/50'
          }
          ${loading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          type="file"
          accept=".txt"
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />
        
        {loading ? (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <p className={`font-medium mb-2 ${
              isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
            }`}>
              正在讀取檔案...
            </p>
            <p className={isDark ? 'text-nadeshiko-400/60' : 'text-nadeshiko-500/60'}>
              偵測編碼中
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📄</div>
            <p className={`font-medium mb-2 ${
              isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
            }`}>
              {isDragging ? '放開以上傳檔案 ✿' : '拖放檔案到這裡'}
            </p>
            <p className={isDark ? 'text-nadeshiko-400/60' : 'text-nadeshiko-500/60'}>
              或點擊選擇檔案
            </p>
          </>
        )}
      </label>

      {error && (
        <div className={`p-4 rounded-xl text-sm ${
          isDark 
            ? 'bg-red-900/20 border border-red-500/30 text-red-300' 
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {error}
        </div>
      )}

      {encodingInfo && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
          isDark 
            ? 'bg-nadeshiko-900/20 border border-nadeshiko-700/30 text-nadeshiko-300' 
            : 'bg-nadeshiko-100/50 border border-nadeshiko-200 text-nadeshiko-600'
        }`}>
          <span>🔍</span>
          <span>
            偵測到編碼：
            <strong className={isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}>
              {encodingInfo.label}
            </strong>
          </span>
        </div>
      )}

      <div className={`text-center text-xs mt-4 ${
        isDark ? 'text-nadeshiko-600' : 'text-nadeshiko-400'
      }`}>
        <p>💡 支援 UTF-8、GBK（簡體）、Big5（繁體）等常見編碼，自動偵測</p>
      </div>
    </div>
  )
}
