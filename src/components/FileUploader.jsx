import { useCallback, useState } from 'react'
import { readFileWithAutoEncoding } from '../utils/encodingDetector'

export default function FileUploader({ onUpload }) {
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
      // 自動偵測編碼並解碼
      const { text, encoding, encodingLabel } = await readFileWithAutoEncoding(file)
      
      // 顯示偵測到的編碼
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
        <h2 className="font-serif text-2xl text-cream mb-2">上傳你的 TXT 檔案</h2>
        <p className="text-warm-400/80 text-sm">
          檔案不會上傳到伺服器，全程在你的瀏覽器處理
        </p>
      </div>

      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragging 
            ? 'border-warm-500 bg-warm-500/10' 
            : 'border-warm-700/50 hover:border-warm-500/50 hover:bg-warm-700/10'
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
            <p className="text-cream font-medium mb-2">正在讀取檔案...</p>
            <p className="text-warm-400/60 text-sm">偵測編碼中</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📄</div>
            <p className="text-cream font-medium mb-2">
              {isDragging ? '放開以上傳檔案' : '拖放檔案到這裡'}
            </p>
            <p className="text-warm-400/60 text-sm">
              或點擊選擇檔案
            </p>
          </>
        )}
      </label>

      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {encodingInfo && (
        <div className="p-4 rounded-xl bg-warm-700/10 border border-warm-700/30 text-warm-400/80 text-sm flex items-center gap-2">
          <span>🔍</span>
          <span>偵測到編碼：<strong className="text-cream">{encodingInfo.label}</strong></span>
        </div>
      )}

      <div className="text-center text-warm-400/50 text-xs mt-4">
        <p>💡 支援 UTF-8、GBK（簡體）、Big5（繁體）等常見編碼，自動偵測</p>
      </div>
    </div>
  )
}
