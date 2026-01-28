import { useCallback, useState } from 'react'

export default function FileUploader({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback(async (file) => {
    setError('')
    
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('請上傳 .txt 格式的檔案')
      return
    }

    try {
      const text = await file.text()
      onUpload(file, text)
    } catch (err) {
      setError('檔案讀取失敗，請確認檔案格式')
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
        `}
      >
        <input
          type="file"
          accept=".txt"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="text-5xl mb-4">📄</div>
        
        <p className="text-cream font-medium mb-2">
          {isDragging ? '放開以上傳檔案' : '拖放檔案到這裡'}
        </p>
        <p className="text-warm-400/60 text-sm">
          或點擊選擇檔案
        </p>
      </label>

      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="text-center text-warm-400/50 text-xs mt-4">
        <p>💡 小提示：支援任意大小的 TXT 檔案，大檔案處理可能需要幾秒鐘</p>
      </div>
    </div>
  )
}
