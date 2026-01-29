import { useCallback, useState, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'

// SVG Icons
const ImageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

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

      ctx.fillStyle = isDark ? '#1E1A1D' : '#FFFCFA'
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
      <h3 
        className="font-serif text-lg font-medium flex items-center gap-3"
        style={{ color: 'var(--text-primary)' }}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, rgba(184, 169, 201, 0.2), rgba(184, 169, 201, 0.1))',
            color: 'var(--lavender)'
          }}
        >
          <ImageIcon />
        </div>
        封面圖片
        <span 
          className="text-sm font-normal"
          style={{ color: 'var(--text-muted)' }}
        >
          （選填）
        </span>
      </h3>

      <canvas ref={canvasRef} className="hidden" />

      {preview ? (
        <div className="flex items-start gap-5">
          <img 
            src={preview} 
            alt="封面預覽" 
            className="w-32 h-48 object-cover rounded-2xl"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
          />
          <div className="space-y-3 pt-2">
            <p 
              className="text-sm flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <CheckIcon style={{ color: 'var(--accent-primary)' }} />
              已自動調整為 EPUB 標準尺寸
            </p>
            <button
              onClick={handleRemove}
              className="text-sm transition-all flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ 
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              }}
            >
              <TrashIcon />
              移除封面
            </button>
          </div>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
          style={{ borderColor: 'var(--border)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-secondary)'
            e.currentTarget.style.background = 'rgba(184, 169, 201, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          <div 
            className="inline-flex mb-3"
            style={{ color: 'var(--accent-secondary)' }}
          >
            <UploadIcon />
          </div>
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            拖放或點擊上傳封面圖片
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            將自動裁切為 2:3 比例
          </p>
        </label>
      )}
    </div>
  )
}
