import { useCallback, useState, useRef } from 'react'

export default function CoverUploader({ cover, setCover }) {
  const [preview, setPreview] = useState(null)
  const canvasRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) return

    const img = new Image()
    img.onload = () => {
      // EPUB 封面建議尺寸 1600x2400 (2:3)
      const targetWidth = 1600
      const targetHeight = 2400
      
      const canvas = canvasRef.current
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')

      // 填充背景
      ctx.fillStyle = '#1a1612'
      ctx.fillRect(0, 0, targetWidth, targetHeight)

      // 計算縮放以覆蓋整個畫布
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      const x = (targetWidth - scaledWidth) / 2
      const y = (targetHeight - scaledHeight) / 2

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

      // 轉為 blob
      canvas.toBlob((blob) => {
        setCover(blob)
        setPreview(URL.createObjectURL(blob))
      }, 'image/jpeg', 0.9)
    }
    img.src = URL.createObjectURL(file)
  }, [setCover])

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
      <h3 className="font-serif text-lg text-cream flex items-center gap-2">
        <span>🖼️</span> 封面圖片
        <span className="text-warm-400/50 text-sm font-normal">（選填）</span>
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
            <p className="text-warm-400/80 text-sm">已自動調整為 EPUB 標準尺寸</p>
            <button
              onClick={handleRemove}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              移除封面
            </button>
          </div>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="block border-2 border-dashed border-warm-700/50 rounded-xl p-8 text-center cursor-pointer hover:border-warm-500/50 hover:bg-warm-700/10 transition-all"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          <p className="text-warm-400/80 text-sm">
            拖放或點擊上傳封面圖片
          </p>
          <p className="text-warm-400/50 text-xs mt-1">
            將自動裁切為 2:3 比例
          </p>
        </label>
      )}
    </div>
  )
}
