import { useCallback, useState, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function CoverUploader({ cover, setCover }) {
  const { isDark } = useTheme()
  const [preview, setPreview] = useState(null)
  const canvasRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) return

    const img = new Image()
    img.onload = () => {
      const targetWidth = 1600
      const targetHeight = 2400
      
      const canvas = canvasRef.current
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = isDark ? '#1a1418' : '#FFFAF8'
      ctx.fillRect(0, 0, targetWidth, targetHeight)

      const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      const x = (targetWidth - scaledWidth) / 2
      const y = (targetHeight - scaledHeight) / 2

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

      canvas.toBlob((blob) => {
        setCover(blob)
        setPreview(URL.createObjectURL(blob))
      }, 'image/jpeg', 0.9)
    }
    img.src = URL.createObjectURL(file)
  }, [setCover, isDark])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleRemove = () => {
    setCover(null)
    setPreview(null)
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-lg flex items-center gap-2 ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'}`}>
        <span>🖼️</span> 封面圖片
        <span className={`text-sm font-normal ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
          （選填）
        </span>
      </h3>

      <canvas ref={canvasRef} className="hidden" />

      {preview ? (
        <div className="flex items-start gap-4">
          <img 
            src={preview} 
            alt="封面預覽" 
            className="w-32 h-48 object-cover rounded-lg shadow-lg"
          />
          <div className="space-y-2">
            <p className={`text-sm ${isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-500/80'}`}>
              已自動調整為 EPUB 標準尺寸 ✓
            </p>
            <button
              onClick={handleRemove}
              className={`text-sm transition-colors ${
                isDark 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-red-500 hover:text-red-600'
              }`}
            >
              移除封面
            </button>
          </div>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all card-hover ${
            isDark 
              ? 'border-dark-border hover:border-nadeshiko-600 hover:bg-nadeshiko-900/10' 
              : 'border-nadeshiko-200 hover:border-nadeshiko-400 hover:bg-nadeshiko-50'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          <p className={`text-sm ${isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-500/80'}`}>
            拖放或點擊上傳封面圖片
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-nadeshiko-600' : 'text-nadeshiko-400'}`}>
            將自動裁切為 2:3 比例
          </p>
        </label>
      )}
    </div>
  )
}
