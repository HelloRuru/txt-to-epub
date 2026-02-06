import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { removeBackground, segmentForeground } from '@imgly/background-removal'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'
import { useTheme } from '../contexts/ThemeContext'

// SVG Icons
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const ScissorsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="6" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
)

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-12 h-12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
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

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function BgRemoval() {
  const { isDark } = useTheme()
  const [images, setImages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelProgress, setModelProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [previewId, setPreviewId] = useState(null)
  const [sliderPos, setSliderPos] = useState(50)
  const [outputFormat, setOutputFormat] = useState('webp') // 'png' | 'webp'
  const [level, setLevel] = useState('smart') // 'solid' | 'normal' | 'smart' | 'deep'
  const abortRef = useRef(false)
  const sliderRef = useRef(null)
  const isDraggingSlider = useRef(false)

  const LEVELS = {
    solid:  { label: '純色去背', desc: '只去除白色等純色背景，最大程度保留人物', sensitivity: 25, useDirect: false },
    normal: { label: '一般去背', desc: '平衡模式，保護皮膚等有色區域', sensitivity: 50, useDirect: false },
    smart:  { label: '智慧去背', desc: '全部由 AI 判斷前景與背景', sensitivity: 0, useDirect: true },
    deep:   { label: '深度去背', desc: '最乾淨，連陰影和邊緣都去除', sensitivity: 75, useDirect: false },
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.originalUrl) URL.revokeObjectURL(img.originalUrl)
        if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
      })
    }
  }, [])

  const addFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(f => ACCEPTED_TYPES.includes(f.type))
    if (validFiles.length === 0) return

    const newImages = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      originalUrl: URL.createObjectURL(file),
      maskBlob: null,
      resultBlob: null,
      resultUrl: null,
      status: 'pending',
      progress: 0,
      error: null,
      fileName: file.name,
      fileSize: file.size,
    }))

    setImages(prev => [...prev, ...newImages])
  }, [])

  const removeImage = useCallback((id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id)
      if (img) {
        if (img.originalUrl) URL.revokeObjectURL(img.originalUrl)
        if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
      }
      return prev.filter(i => i.id !== id)
    })
    if (previewId === id) setPreviewId(null)
  }, [previewId])

  const clearAll = useCallback(() => {
    images.forEach(img => {
      if (img.originalUrl) URL.revokeObjectURL(img.originalUrl)
      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
    })
    setImages([])
    setPreviewId(null)
  }, [images])

  const updateImage = useCallback((id, updates) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img))
  }, [])

  // Load blob into an Image element
  const loadImage = (blob) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = URL.createObjectURL(blob)
  })

  // Smart composite: AI mask + color-aware protection
  // Only removes pixels that are BOTH AI-detected-background AND visually similar to background (white/light)
  const compositeWithMask = async (originalBlob, maskBlob, sensitivity) => {
    const [origImg, maskImg] = await Promise.all([loadImage(originalBlob), loadImage(maskBlob)])
    const w = origImg.naturalWidth
    const h = origImg.naturalHeight

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    ctx.drawImage(origImg, 0, 0, w, h)
    const origData = ctx.getImageData(0, 0, w, h)

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(maskImg, 0, 0, w, h)
    const maskData = ctx.getImageData(0, 0, w, h)

    URL.revokeObjectURL(origImg.src)
    URL.revokeObjectURL(maskImg.src)

    // sensitivity: 0 (keep everything) to 100 (remove aggressively)
    const t = sensitivity / 100 // 0.0 - 1.0

    const out = ctx.createImageData(w, h)
    for (let i = 0; i < origData.data.length; i += 4) {
      const r = origData.data[i]
      const g = origData.data[i + 1]
      const b = origData.data[i + 2]
      const maskVal = maskData.data[i] / 255 // 0=background, 1=foreground

      // Color analysis
      const maxC = Math.max(r, g, b)
      const minC = Math.min(r, g, b)
      const brightness = (r + g + b) / (3 * 255)
      const saturation = maxC > 0 ? (maxC - minC) / maxC : 0

      // Color protection signal:
      // High saturation (colored) → strong protection
      // Low brightness (dark) → moderate protection
      // White/light unsaturated → no protection
      const colorProtection = Math.min(1, saturation * 2.5 + (1 - brightness) * 0.6)

      // Combined foreground confidence:
      // Pixel is foreground if AI says so OR if it has distinctive color
      const confidence = Math.max(maskVal, colorProtection)

      // Apply threshold with smooth edge
      const edge = t * 0.3
      let alpha
      if (confidence >= t) {
        alpha = 255
      } else if (confidence >= t - edge) {
        alpha = Math.round(((confidence - (t - edge)) / edge) * 255)
      } else {
        alpha = 0
      }

      out.data[i] = r
      out.data[i + 1] = g
      out.data[i + 2] = b
      out.data[i + 3] = alpha
    }
    ctx.putImageData(out, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  }

  const progressCallback = (imgId) => (key, current, total) => {
    if (key === 'compute:inference') {
      updateImage(imgId, { progress: Math.round((current / total) * 100) })
    }
    if (key.startsWith('fetch:')) {
      setModelLoading(true)
      setModelProgress(Math.round((current / total) * 100))
    }
  }

  const processAll = async () => {
    setIsProcessing(true)
    abortRef.current = false

    const cfg = LEVELS[level]
    const pending = images.filter(img => img.status !== 'done')

    for (const img of pending) {
      if (abortRef.current) break

      updateImage(img.id, { status: 'processing', progress: 0 })

      try {
        let resultBlob, maskBlob = null

        if (cfg.useDirect) {
          resultBlob = await removeBackground(img.file, {
            model: 'isnet_fp16',
            output: { format: 'image/png', quality: 0.9 },
            progress: progressCallback(img.id),
          })
        } else {
          maskBlob = await segmentForeground(img.file, {
            model: 'isnet_fp16',
            output: { format: 'image/png', quality: 1 },
            progress: progressCallback(img.id),
          })
          resultBlob = await compositeWithMask(img.file, maskBlob, cfg.sensitivity)
        }

        setModelLoading(false)

        const resultUrl = URL.createObjectURL(resultBlob)
        updateImage(img.id, {
          status: 'done',
          progress: 100,
          maskBlob,
          resultBlob,
          resultUrl,
        })
      } catch (err) {
        setModelLoading(false)
        updateImage(img.id, {
          status: 'error',
          error: err.message || '處理失敗',
        })
      }
    }

    setIsProcessing(false)
  }

  // Re-composite when switching between solid/normal levels (non-direct only)
  const recompositeWithLevel = async (newLevel) => {
    const cfg = LEVELS[newLevel]
    if (cfg.useDirect) return // direct mode images can't be recomposited
    const doneImages = images.filter(img => img.status === 'done' && img.maskBlob)
    for (const img of doneImages) {
      const resultBlob = await compositeWithMask(img.file, img.maskBlob, cfg.sensitivity)
      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
      const resultUrl = URL.createObjectURL(resultBlob)
      updateImage(img.id, { resultBlob, resultUrl })
    }
  }

  const cancelProcessing = () => {
    abortRef.current = true
  }

  const toWebP = (pngBlob) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(img.src)
        resolve(blob)
      }, 'image/webp', 0.9)
    }
    img.src = URL.createObjectURL(pngBlob)
  })

  const getDownloadBlob = async (resultBlob) => {
    if (outputFormat === 'webp') return await toWebP(resultBlob)
    return resultBlob
  }

  const getExt = () => outputFormat === 'webp' ? '.webp' : '.png'

  const downloadOne = async (img) => {
    if (!img.resultBlob) return
    const blob = await getDownloadBlob(img.resultBlob)
    const name = img.fileName.replace(/\.[^.]+$/, '') + '_no-bg' + getExt()
    saveAs(blob, name)
  }

  const downloadAllZip = async () => {
    const doneImages = images.filter(img => img.status === 'done')
    if (doneImages.length === 0) return

    const zip = new JSZip()
    for (const img of doneImages) {
      const blob = await getDownloadBlob(img.resultBlob)
      const name = img.fileName.replace(/\.[^.]+$/, '') + '_no-bg' + getExt()
      zip.file(name, blob)
    }

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    saveAs(content, `bg-removed-${Date.now()}.zip`)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  // Slider drag handlers
  const handleSliderMove = useCallback((clientX) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }, [])

  const handlePointerDown = useCallback((e) => {
    isDraggingSlider.current = true
    handleSliderMove(e.clientX)
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [handleSliderMove])

  const handlePointerMove = useCallback((e) => {
    if (isDraggingSlider.current) handleSliderMove(e.clientX)
  }, [handleSliderMove])

  const handlePointerUp = useCallback(() => {
    isDraggingSlider.current = false
  }, [])

  const doneCount = images.filter(i => i.status === 'done').length
  const previewImage = images.find(i => i.id === previewId)

  const instructions = [
    '上傳圖片，AI 自動去除背景，支援 PNG、JPG、WebP',
    '不確定選哪個？選「智慧去背」讓 AI 自己判斷就對了',
    '插畫角色被吃掉？試試「純色去背」或「一般去背」',
    '全程本機處理，圖片不會上傳。不限解析度，完全免費',
  ]

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Nav */}
      <nav
        className="sticky top-0 z-10 backdrop-blur-md transition-colors"
        style={{
          borderBottom: '1px solid var(--border)',
          background: isDark ? 'rgba(30, 26, 29, 0.8)' : 'rgba(255, 252, 250, 0.8)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <ScissorsIcon style={{ color: 'var(--accent-secondary)' }} />
            批次去背
          </h1>

          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Instructions */}
        <div
          className="mb-8 p-8 rounded-3xl transition-all"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
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
              <ImageIcon />
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

        {/* Upload Area */}
        <div
          className="mb-8 rounded-3xl p-8 md:p-10 transition-all"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="text-center mb-6">
            <h2
              className="font-serif text-2xl font-semibold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              上傳圖片
            </h2>
            <p
              className="text-sm flex items-center justify-center gap-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <ShieldIcon style={{ color: 'var(--accent-primary)' }} />
              圖片不會離開你的裝置
            </p>
          </div>

          <label
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
            className="block border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300"
            style={{
              borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border)',
              background: isDragging ? 'rgba(212, 165, 165, 0.1)' : 'transparent',
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
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => {
                if (e.target.files.length) addFiles(e.target.files)
                e.target.value = ''
              }}
              className="hidden"
            />
            <div className="inline-flex mb-4" style={{ color: 'var(--accent-primary)' }}>
              <UploadIcon />
            </div>
            <p className="font-serif font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {isDragging ? '放開以上傳' : '拖放圖片到這裡'}
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              或點擊選擇圖片（可多選）
            </p>
          </label>
        </div>

        {/* Model Loading Progress */}
        {modelLoading && (
          <div
            className="mb-8 rounded-3xl p-6 transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <p className="text-sm mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>
              AI 模型載入中... {modelProgress}%
            </p>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${modelProgress}%`,
                  background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                }}
              />
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              首次載入約需下載 40MB 模型資料，之後會快取
            </p>
          </div>
        )}

        {/* Image Queue */}
        {images.length > 0 && (
          <>
            {/* Settings + Actions */}
            <div
              className="mb-6 rounded-2xl p-5"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Level selector */}
              <div className="mb-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                  去背模式
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(LEVELS).map(([id, cfg]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setLevel(id)
                        if (doneCount > 0 && !cfg.useDirect) {
                          recompositeWithLevel(id)
                        }
                      }}
                      disabled={isProcessing}
                      className="p-3 rounded-2xl text-left transition-all"
                      style={{
                        background: level === id ? 'rgba(212, 165, 165, 0.12)' : 'var(--bg-secondary)',
                        border: `2px solid ${level === id ? 'var(--accent-primary)' : 'transparent'}`,
                        opacity: isProcessing ? 0.6 : 1,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span className="text-sm font-medium block mb-0.5" style={{ color: 'var(--text-primary)' }}>
                        {cfg.label}
                      </span>
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {cfg.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format + Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {doneCount > 0
                      ? `已完成 ${doneCount} / ${images.length} 張`
                      : `共 ${images.length} 張圖片`
                    }
                  </p>

                  {/* Format toggle */}
                  <div
                    className="flex items-center rounded-full overflow-hidden text-xs"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    {['png', 'webp'].map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setOutputFormat(fmt)}
                        className="px-3 py-1.5 transition-all font-medium"
                        style={{
                          background: outputFormat === fmt
                            ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                            : 'var(--bg-card)',
                          color: outputFormat === fmt ? 'white' : 'var(--text-muted)',
                        }}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

              <div className="flex gap-3">
                {!isProcessing && images.some(i => i.status !== 'done') && (
                  <button
                    onClick={processAll}
                    className="px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(212, 165, 165, 0.3)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <ScissorsIcon />
                    開始去背
                  </button>
                )}

                {isProcessing && (
                  <button
                    onClick={cancelProcessing}
                    className="px-6 py-2.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    取消
                  </button>
                )}

                {doneCount > 1 && (
                  <button
                    onClick={downloadAllZip}
                    className="px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)'
                      e.currentTarget.style.color = 'var(--accent-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                  >
                    <DownloadIcon />
                    下載全部 (ZIP)
                  </button>
                )}

                <button
                  onClick={clearAll}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-full text-sm transition-all flex items-center gap-2"
                  style={{
                    color: 'var(--text-muted)',
                    opacity: isProcessing ? 0.5 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => { if (!isProcessing) e.currentTarget.style.color = 'var(--accent-primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <TrashIcon />
                  清除
                </button>
              </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {images.map(img => (
                <div
                  key={img.id}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative aspect-square overflow-hidden cursor-pointer"
                    onClick={() => {
                      if (img.status === 'done') {
                        setPreviewId(previewId === img.id ? null : img.id)
                        setSliderPos(50)
                      }
                    }}
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <img
                      src={img.status === 'done' ? img.resultUrl : img.originalUrl}
                      alt={img.fileName}
                      className="w-full h-full object-contain"
                      style={img.status === 'done' ? {
                        backgroundImage: `linear-gradient(45deg, ${isDark ? '#3a3a3a' : '#e0e0e0'} 25%, transparent 25%), linear-gradient(-45deg, ${isDark ? '#3a3a3a' : '#e0e0e0'} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${isDark ? '#3a3a3a' : '#e0e0e0'} 75%), linear-gradient(-45deg, transparent 75%, ${isDark ? '#3a3a3a' : '#e0e0e0'} 75%)`,
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                      } : {}}
                    />

                    {/* Processing overlay */}
                    {img.status === 'processing' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: isDark ? 'rgba(30,26,29,0.7)' : 'rgba(255,252,250,0.7)' }}
                      >
                        <div
                          className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin mb-3"
                          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                        />
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          去背中... {img.progress}%
                        </p>
                      </div>
                    )}

                    {/* Status badge */}
                    {img.status === 'done' && (
                      <div
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: '#A8B5A0', color: 'white' }}
                      >
                        <CheckIcon />
                      </div>
                    )}

                    {img.status === 'error' && (
                      <div
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: '#C9929A', color: 'white' }}
                      >
                        <AlertIcon />
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {img.status === 'processing' && (
                    <div className="h-1" style={{ background: 'var(--bg-secondary)' }}>
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${img.progress}%`,
                          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                        }}
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {img.fileName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatFileSize(img.fileSize)}
                        {img.status === 'error' && (
                          <span style={{ color: '#C9929A' }}> · {img.error}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {img.status === 'done' && (
                        <button
                          onClick={() => downloadOne(img)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="下載"
                        >
                          <DownloadIcon />
                        </button>
                      )}

                      {!isProcessing && (
                        <button
                          onClick={() => removeImage(img.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="移除"
                        >
                          <XIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Before/After Preview */}
        {previewImage && previewImage.status === 'done' && (
          <div
            className="mb-8 rounded-3xl overflow-hidden transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-serif text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Before / After 對比
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadOne(previewImage)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: 'white',
                  }}
                >
                  <DownloadIcon />
                  下載
                </button>
                <button
                  onClick={() => setPreviewId(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <XIcon />
                </button>
              </div>
            </div>

            {/* Slider comparison */}
            <div
              ref={sliderRef}
              className="relative select-none cursor-col-resize"
              style={{
                backgroundImage: `linear-gradient(45deg, ${isDark ? '#3a3a3a' : '#e0e0e0'} 25%, transparent 25%), linear-gradient(-45deg, ${isDark ? '#3a3a3a' : '#e0e0e0'} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${isDark ? '#3a3a3a' : '#e0e0e0'} 75%), linear-gradient(-45deg, transparent 75%, ${isDark ? '#3a3a3a' : '#e0e0e0'} 75%)`,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Result (full width behind) */}
              <img
                src={previewImage.resultUrl}
                alt="Result"
                className="w-full block"
                style={{ maxHeight: '500px', objectFit: 'contain', margin: '0 auto' }}
                draggable={false}
              />

              {/* Original (clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={previewImage.originalUrl}
                  alt="Original"
                  className="w-full block"
                  style={{
                    maxHeight: '500px',
                    objectFit: 'contain',
                    width: sliderRef.current ? `${sliderRef.current.offsetWidth}px` : '100%',
                  }}
                  draggable={false}
                />
              </div>

              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              >
                <div
                  className="w-0.5 h-full"
                  style={{ background: 'white', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    left: '50%',
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="#666">
                    <path d="M8 4l-6 8 6 8"/>
                    <path d="M16 4l6 8-6 8"/>
                  </svg>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                原圖
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                去背
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
