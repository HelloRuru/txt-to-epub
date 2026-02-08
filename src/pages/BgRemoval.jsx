import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { removeBackground } from '@imgly/background-removal'
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

const PipetteIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="m2 22 1-1h3l9-9"/>
    <path d="M3 21v-3l9-9"/>
    <path d="m15 6 3.4-3.4a2.12 2.12 0 1 1 3 3L18 9"/>
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
  const [suggestion, setSuggestion] = useState(null) // { text, target }
  const [eyedropperActive, setEyedropperActive] = useState(false)
  const [eyedropperMode, setEyedropperMode] = useState('remove') // 'remove' | 'restore'
  const [customBgColors, setCustomBgColors] = useState([]) // [{r,g,b}, ...] 要去除的色
  const [restoreColors, setRestoreColors] = useState([])   // [{r,g,b}, ...] 要還原的色
  const [tolerance, setTolerance] = useState(20)           // 純色去背容差（10-60）
  const abortRef = useRef(false)
  const sliderRef = useRef(null)
  const isDraggingSlider = useRef(false)

  const LEVELS = {
    solid:  { label: '純色去背', desc: '只去除邊緣相連的純色背景', type: 'solid' },
    normal: { label: '一般去背', desc: 'AI 去背＋強力色彩保護，膚色不被吃', type: 'ai', protection: 0.85 },
    smart:  { label: '智慧去背', desc: 'AI 為主，適度保護非背景區域', type: 'ai', protection: 0.5 },
    deep:   { label: '深度去背', desc: '嘗試給你最乾淨的結果', type: 'ai', protection: 0 },
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
      solidResultBlob: null,
      aiResultBlob: null,
      bgColor: null,
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
    setCustomBgColors([])
    setRestoreColors([])
    setEyedropperActive(false)
    setEyedropperMode('remove')
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

  const canvasToBlob = (canvas) => new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })

  // RGB Euclidean distance (max ~441)
  const colorDist = (r1, g1, b1, r2, g2, b2) =>
    Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)

  // Detect dominant background color by sampling image border pixels
  const detectBgColor = (data, w, h) => {
    const samples = []
    const step = Math.max(1, Math.floor(Math.max(w, h) / 200))
    const px = (x, y) => {
      const i = (y * w + x) * 4
      return [data[i], data[i + 1], data[i + 2]]
    }
    for (let x = 0; x < w; x += step) {
      samples.push(px(x, 0))
      samples.push(px(x, h - 1))
    }
    for (let y = 1; y < h - 1; y += step) {
      samples.push(px(0, y))
      samples.push(px(w - 1, y))
    }
    // Cluster similar colors
    const clusters = []
    for (const [r, g, b] of samples) {
      let added = false
      for (const c of clusters) {
        if (colorDist(r, g, b, c.r, c.g, c.b) < 30) {
          c.s[0] += r; c.s[1] += g; c.s[2] += b; c.n++
          c.r = Math.round(c.s[0] / c.n)
          c.g = Math.round(c.s[1] / c.n)
          c.b = Math.round(c.s[2] / c.n)
          added = true
          break
        }
      }
      if (!added) clusters.push({ r, g, b, n: 1, s: [r, g, b] })
    }
    clusters.sort((a, b) => b.n - a.n)
    return clusters[0] ? { r: clusters[0].r, g: clusters[0].g, b: clusters[0].b } : { r: 255, g: 255, b: 255 }
  }

  // ── 純色去背：洪水填充 + 封閉區域偵測 ──
  // 1. 從邊緣洪水填充移除相連純色（安全，不誤傷前景）
  // 2. 找出被前景包圍的小型封閉背景區域，一併移除（如角色雙腿間的白色）
  const solidColorRemoval = async (originalBlob, overrideBgColors = null, tol = tolerance) => {
    const img = await loadImage(originalBlob)
    const w = img.naturalWidth, h = img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(img.src)

    const imageData = ctx.getImageData(0, 0, w, h)
    const d = imageData.data
    const autoBg = detectBgColor(d, w, h)
    const bgList = overrideBgColors && overrideBgColors.length > 0 ? overrideBgColors : [autoBg]

    // 計算像素與所有背景色的最小距離
    const minDistToBg = (r, g, b) => {
      let min = Infinity
      for (const bg of bgList) {
        const d2 = colorDist(r, g, b, bg.r, bg.g, bg.b)
        if (d2 < min) min = d2
      }
      return min
    }
    const total = w * h
    const isBg = new Uint8Array(total)     // 1=confirmed background
    const visited = new Uint8Array(total)  // 1=visited by flood fill

    // Step 1: 從邊緣洪水填充
    const queue = []
    let head = 0
    const enqueue = (idx) => {
      if (visited[idx]) return
      visited[idx] = 1
      const i = idx * 4
      if (minDistToBg(d[i], d[i + 1], d[i + 2]) <= tol) {
        isBg[idx] = 1
        queue.push(idx)
      }
    }
    for (let x = 0; x < w; x++) { enqueue(x); enqueue((h - 1) * w + x) }
    for (let y = 1; y < h - 1; y++) { enqueue(y * w); enqueue(y * w + w - 1) }
    while (head < queue.length) {
      const idx = queue[head++]
      const x = idx % w, y = (idx - x) / w
      if (y > 0) enqueue(idx - w)
      if (y < h - 1) enqueue(idx + w)
      if (x > 0) enqueue(idx - 1)
      if (x < w - 1) enqueue(idx + 1)
    }

    // Step 2: 找封閉背景區域（未被洪水填充觸及的背景色像素群）
    const maxIslandRatio = 0.15 // 封閉區域不超過圖片 15% 才移除
    for (let idx = 0; idx < total; idx++) {
      if (visited[idx]) continue
      const i = idx * 4
      if (minDistToBg(d[i], d[i + 1], d[i + 2]) > tol) {
        visited[idx] = 1
        continue
      }
      // BFS 找出這個封閉區域的所有像素
      const island = [idx]
      visited[idx] = 1
      let ih = 0
      while (ih < island.length) {
        const cur = island[ih++]
        const cx = cur % w, cy = (cur - cx) / w
        const neighbors = []
        if (cy > 0) neighbors.push(cur - w)
        if (cy < h - 1) neighbors.push(cur + w)
        if (cx > 0) neighbors.push(cur - 1)
        if (cx < w - 1) neighbors.push(cur + 1)
        for (const n of neighbors) {
          if (visited[n]) continue
          visited[n] = 1
          const ni = n * 4
          if (minDistToBg(d[ni], d[ni + 1], d[ni + 2]) <= tol) {
            island.push(n)
          }
        }
      }
      // 小於 15% 的封閉區域 → 移除（是被前景包圍的背景）
      if (island.length / total <= maxIslandRatio) {
        for (const px of island) isBg[px] = 1
      }
    }

    // Step 3: 套用 alpha + 邊緣羽化
    let removedCount = 0
    for (let idx = 0; idx < total; idx++) {
      if (isBg[idx]) {
        d[idx * 4 + 3] = 0
        removedCount++
      } else {
        const x = idx % w, y = (idx - x) / w
        const nearBg =
          (x > 0 && isBg[idx - 1]) || (x < w - 1 && isBg[idx + 1]) ||
          (y > 0 && isBg[idx - w]) || (y < h - 1 && isBg[idx + w])
        if (nearBg) {
          const i = idx * 4
          const dist = minDistToBg(d[i], d[i + 1], d[i + 2])
          d[i + 3] = Math.round(Math.min(255, (dist / (tol * 2)) * 255))
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
    return { blob: await canvasToBlob(canvas), bgColor: autoBg, removedRatio: removedCount / total }
  }

  // ── AI 去背後製：以背景色差保護前景像素 ──
  const protectAiResult = async (originalBlob, aiResultBlob, bgColors, protection) => {
    if (protection === 0) return aiResultBlob

    // bgColors 可以是單一 {r,g,b} 或陣列 [{r,g,b}, ...]
    const bgList = Array.isArray(bgColors) ? bgColors : [bgColors]
    if (bgList.length === 0) return aiResultBlob

    const [origImg, aiImg] = await Promise.all([loadImage(originalBlob), loadImage(aiResultBlob)])
    const w = origImg.naturalWidth, h = origImg.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')

    ctx.drawImage(origImg, 0, 0, w, h)
    const origData = ctx.getImageData(0, 0, w, h)
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(aiImg, 0, 0, w, h)
    const aiData = ctx.getImageData(0, 0, w, h)
    URL.revokeObjectURL(origImg.src)
    URL.revokeObjectURL(aiImg.src)

    const od = origData.data, ad = aiData.data

    const minDistToBg = (r, g, b) => {
      let min = Infinity
      for (const bg of bgList) {
        const d2 = colorDist(r, g, b, bg.r, bg.g, bg.b)
        if (d2 < min) min = d2
      }
      return min
    }

    for (let i = 0; i < ad.length; i += 4) {
      const aiAlpha = ad[i + 3]
      if (aiAlpha >= 250) continue

      const r = od[i], g = od[i + 1], b = od[i + 2]
      const distFromBg = minDistToBg(r, g, b)

      // 色差 > 40 → 不是背景 → 保護
      // 陡峭曲線：色差 70 的淺膚色也能得到完整保護
      if (distFromBg > 40) {
        const fgConf = Math.min(1, (distFromBg - 40) / 30)
        const restore = fgConf * protection
        ad[i] = r
        ad[i + 1] = g
        ad[i + 2] = b
        ad[i + 3] = Math.min(255, Math.round(aiAlpha + (255 - aiAlpha) * restore))
      }
    }
    ctx.putImageData(aiData, 0, 0)
    return canvasToBlob(canvas)
  }

  // ── 還原：將被誤去除的像素（匹配還原色）恢復 alpha ──
  const applyRestore = async (resultBlob, originalFile, colors) => {
    if (!colors || colors.length === 0) return resultBlob

    const [origImg, resImg] = await Promise.all([loadImage(originalFile), loadImage(resultBlob)])
    const w = origImg.naturalWidth, h = origImg.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')

    ctx.drawImage(origImg, 0, 0, w, h)
    const origData = ctx.getImageData(0, 0, w, h)
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(resImg, 0, 0, w, h)
    const resData = ctx.getImageData(0, 0, w, h)
    URL.revokeObjectURL(origImg.src)
    URL.revokeObjectURL(resImg.src)

    const od = origData.data, rd = resData.data
    const tolerance = 50

    for (let i = 0; i < rd.length; i += 4) {
      if (rd[i + 3] >= 250) continue // 已不透明，跳過

      const r = od[i], g = od[i + 1], b = od[i + 2]
      for (const c of colors) {
        if (colorDist(r, g, b, c.r, c.g, c.b) <= tolerance) {
          rd[i] = r
          rd[i + 1] = g
          rd[i + 2] = b
          rd[i + 3] = 255
          break
        }
      }
    }

    ctx.putImageData(resData, 0, 0)
    return canvasToBlob(canvas)
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
    const removedRatios = []
    setSuggestion(null)

    for (const img of pending) {
      if (abortRef.current) break
      updateImage(img.id, { status: 'processing', progress: 0 })

      try {
        // 先跑純色去背（快速，同時偵測背景色，供切換模式用）
        const solidResult = await solidColorRemoval(img.file, customBgColors.length > 0 ? customBgColors : null)
        const solidResultBlob = solidResult.blob
        const bgColor = solidResult.bgColor
        removedRatios.push(solidResult.removedRatio)

        let aiResultBlob = null
        let resultBlob

        if (cfg.type === 'solid') {
          resultBlob = solidResultBlob
          updateImage(img.id, { progress: 100 })
        } else {
          // AI 去背
          aiResultBlob = await removeBackground(img.file, {
            model: 'isnet_fp16',
            output: { format: 'image/png', quality: 1 },
            progress: progressCallback(img.id),
          })
          setModelLoading(false)
          resultBlob = await protectAiResult(img.file, aiResultBlob, bgColor, cfg.protection)
        }

        // 套用還原色（如果有）
        if (restoreColors.length > 0) {
          resultBlob = await applyRestore(resultBlob, img.file, restoreColors)
        }

        const resultUrl = URL.createObjectURL(resultBlob)
        updateImage(img.id, {
          status: 'done',
          progress: 100,
          solidResultBlob,
          aiResultBlob,
          bgColor,
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

    // 處理完成後，分析結果並建議更適合的模式
    if (!abortRef.current && removedRatios.length > 0) {
      const avgRatio = removedRatios.reduce((a, b) => a + b, 0) / removedRatios.length
      if (cfg.type === 'solid' && avgRatio < 0.05) {
        setSuggestion({ text: '背景似乎不是純色，試試讓 AI 來判斷？', target: 'normal' })
      } else if (cfg.type === 'solid' && avgRatio > 0.85) {
        setSuggestion({ text: '去除比例偏高，建議讓 AI 更精準地判斷', target: 'normal' })
      } else if (cfg.type === 'ai' && avgRatio > 0.25) {
        setSuggestion({ text: '背景看起來是純色，用「純色去背」更快也更安全', target: 'solid' })
      }
    }

    setIsProcessing(false)
  }

  // Re-composite when switching levels (instant for cached results)
  const recompositeWithLevel = async (newLevel) => {
    const cfg = LEVELS[newLevel]
    const doneImages = images.filter(img => img.status === 'done')

    for (const img of doneImages) {
      let resultBlob

      if (cfg.type === 'solid') {
        const colors = customBgColors.length > 0 ? customBgColors : null
        const result = await solidColorRemoval(img.file, colors)
        resultBlob = result.blob
        updateImage(img.id, { solidResultBlob: result.blob, bgColor: result.bgColor })
      } else {
        if (img.aiResultBlob) {
          const bgArr = customBgColors.length > 0 ? [img.bgColor, ...customBgColors] : img.bgColor
          resultBlob = await protectAiResult(img.file, img.aiResultBlob, bgArr, cfg.protection)
        } else {
          // No AI cache — mark as pending so user re-processes
          if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
          updateImage(img.id, { status: 'pending', resultBlob: null, resultUrl: null, progress: 0 })
          continue
        }
      }

      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
      const resultUrl = URL.createObjectURL(resultBlob)
      updateImage(img.id, { resultBlob, resultUrl })
    }
  }

  const cancelProcessing = () => {
    abortRef.current = true
  }

  // 滴管：使用者點擊圖片取色，指定要去除的背景色
  const handleEyedropperPick = async (e, imgData) => {
    const imgEl = e.currentTarget.querySelector('img')
    if (!imgEl) return

    const rect = imgEl.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const origImg = new Image()
    const tmpUrl = URL.createObjectURL(imgData.file)
    origImg.src = tmpUrl
    await new Promise(r => { origImg.onload = r })

    const nw = origImg.naturalWidth, nh = origImg.naturalHeight
    const dw = rect.width, dh = rect.height
    const imgAspect = nw / nh, boxAspect = dw / dh

    let rw, rh, ox, oy
    if (imgAspect > boxAspect) {
      rw = dw; rh = dw / imgAspect; ox = 0; oy = (dh - rh) / 2
    } else {
      rh = dh; rw = dh * imgAspect; ox = (dw - rw) / 2; oy = 0
    }

    const px = Math.round(((clickX - ox) / rw) * nw)
    const py = Math.round(((clickY - oy) / rh) * nh)

    if (px >= 0 && px < nw && py >= 0 && py < nh) {
      const canvas = document.createElement('canvas')
      canvas.width = nw; canvas.height = nh
      const ctx = canvas.getContext('2d')
      ctx.drawImage(origImg, 0, 0)
      const pixel = ctx.getImageData(px, py, 1, 1).data
      const picked = { r: pixel[0], g: pixel[1], b: pixel[2] }

      URL.revokeObjectURL(tmpUrl)

      const doneImgs = images.filter(i => i.status === 'done')

      if (eyedropperMode === 'restore') {
        // ── 還原模式：把匹配的被去掉像素恢復 ──
        const newRestores = [...restoreColors, picked]
        setRestoreColors(newRestores)

        for (const doneImg of doneImgs) {
          const restored = await applyRestore(doneImg.resultBlob, doneImg.file, [picked])
          if (doneImg.resultUrl) URL.revokeObjectURL(doneImg.resultUrl)
          const resultUrl = URL.createObjectURL(restored)
          updateImage(doneImg.id, { resultBlob: restored, resultUrl })
        }
      } else {
        // ── 去除模式：加入背景色重新處理 ──
        const newColors = [...customBgColors, picked]
        setCustomBgColors(newColors)

        const cfg = LEVELS[level]
        for (const doneImg of doneImgs) {
          let resultBlob
          if (cfg.type === 'solid') {
            const result = await solidColorRemoval(doneImg.file, newColors)
            resultBlob = result.blob
            updateImage(doneImg.id, { solidResultBlob: result.blob, bgColor: result.bgColor })
          } else if (doneImg.aiResultBlob) {
            const bgArr = [doneImg.bgColor, ...newColors]
            resultBlob = await protectAiResult(doneImg.file, doneImg.aiResultBlob, bgArr, cfg.protection)
          } else continue
          // 去除後也套用還原色
          if (restoreColors.length > 0) {
            resultBlob = await applyRestore(resultBlob, doneImg.file, restoreColors)
          }
          if (doneImg.resultUrl) URL.revokeObjectURL(doneImg.resultUrl)
          const resultUrl = URL.createObjectURL(resultBlob)
          updateImage(doneImg.id, { resultBlob, resultUrl })
        }
      }
    } else {
      URL.revokeObjectURL(tmpUrl)
    }
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

  const getDatePrefix = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}${mm}${dd}`
  }

  const getSeqName = (img) => {
    const idx = images.filter(i => i.status === 'done').indexOf(img)
    const seq = String(idx + 1).padStart(2, '0')
    const baseName = img.fileName.replace(/\.[^.]+$/, '')
    return `${getDatePrefix()}-${seq}.${baseName}${getExt()}`
  }

  const downloadOne = async (img) => {
    if (!img.resultBlob) return
    const blob = await getDownloadBlob(img.resultBlob)
    saveAs(blob, getSeqName(img))
  }

  const downloadAllZip = async () => {
    const doneImages = images.filter(img => img.status === 'done')
    if (doneImages.length === 0) return

    const zip = new JSZip()
    for (let i = 0; i < doneImages.length; i++) {
      const img = doneImages[i]
      const blob = await getDownloadBlob(img.resultBlob)
      const seq = String(i + 1).padStart(2, '0')
      const baseName = img.fileName.replace(/\.[^.]+$/, '')
      zip.file(`${getDatePrefix()}-${seq}.${baseName}${getExt()}`, blob)
    }

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    saveAs(content, `${getDatePrefix()}-BGRemove.zip`)
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
    '上傳圖片，自動去除背景，支援 PNG、JPG、WebP',
    '白底圖片？選「純色去背」最快也最安全，完全不靠 AI',
    '複雜背景？選「一般去背」或「智慧去背」由 AI 處理',
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

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center animate-float"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                boxShadow: '0 2px 12px rgba(212, 165, 165, 0.3)',
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path d="M12 2C12 2 9.5 6 9.5 9.5C9.5 11.5 10.6 12 12 12C13.4 12 14.5 11.5 14.5 9.5C14.5 6 12 2 12 2Z" fill="white" opacity="0.9"/>
                <path d="M6.5 7C6.5 7 3 9 3 12C3 14 4.5 15 6 14.5C7.5 14 8 12.5 7.5 11C7 9 6.5 7 6.5 7Z" fill="white" opacity="0.7"/>
                <path d="M17.5 7C17.5 7 21 9 21 12C21 14 19.5 15 18 14.5C16.5 14 16 12.5 16.5 11C17 9 17.5 7 17.5 7Z" fill="white" opacity="0.7"/>
                <path d="M12 12C12 12 12 16 12 18C12 20 13 22 12 22C11 22 12 20 12 18C12 16 12 12 12 12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
                <path d="M10 15C8.5 16 7 16.5 6 16" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
                <path d="M14 15C15.5 16 17 16.5 18 16" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                批次去背
              </h1>
              <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>
                HelloRuru
              </span>
            </div>
          </div>

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
                        setSuggestion(null)
                        if (doneCount > 0) {
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

                {/* 容差滑桿 — 純色模式 */}
                {level === 'solid' && (
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      容差
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={tolerance}
                      onChange={(e) => setTolerance(Number(e.target.value))}
                      onMouseUp={async () => {
                        if (doneCount > 0) {
                          const colors = customBgColors.length > 0 ? customBgColors : null
                          const doneImgs = images.filter(i => i.status === 'done')
                          for (const img of doneImgs) {
                            const result = await solidColorRemoval(img.file, colors)
                            let resultBlob = result.blob
                            if (restoreColors.length > 0) resultBlob = await applyRestore(resultBlob, img.file, restoreColors)
                            if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
                            const resultUrl = URL.createObjectURL(resultBlob)
                            updateImage(img.id, { solidResultBlob: result.blob, bgColor: result.bgColor, resultBlob, resultUrl })
                          }
                        }
                      }}
                      onTouchEnd={async () => {
                        if (doneCount > 0) {
                          const colors = customBgColors.length > 0 ? customBgColors : null
                          const doneImgs = images.filter(i => i.status === 'done')
                          for (const img of doneImgs) {
                            const result = await solidColorRemoval(img.file, colors)
                            let resultBlob = result.blob
                            if (restoreColors.length > 0) resultBlob = await applyRestore(resultBlob, img.file, restoreColors)
                            if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
                            const resultUrl = URL.createObjectURL(resultBlob)
                            updateImage(img.id, { solidResultBlob: result.blob, bgColor: result.bgColor, resultBlob, resultUrl })
                          }
                        }
                      }}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((tolerance - 10) / 50) * 100}%, var(--bg-secondary) ${((tolerance - 10) / 50) * 100}%, var(--bg-secondary) 100%)`,
                        accentColor: 'var(--accent-primary)',
                      }}
                    />
                    <span className="text-xs font-mono w-6 text-right" style={{ color: 'var(--text-muted)' }}>
                      {tolerance}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {tolerance <= 15 ? '精準' : tolerance <= 30 ? '適中' : '寬鬆'}
                    </span>
                  </div>
                )}

                {/* Eyedropper — 去完背後仍可微調 */}
                {doneCount > 0 || level === 'solid' ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 滴管去除 */}
                      <button
                        onClick={() => {
                          if (eyedropperActive && eyedropperMode === 'remove') {
                            setEyedropperActive(false)
                          } else {
                            setEyedropperMode('remove')
                            setEyedropperActive(true)
                          }
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
                        style={{
                          background: eyedropperActive && eyedropperMode === 'remove' ? 'rgba(212, 165, 165, 0.15)' : 'var(--bg-secondary)',
                          border: `1.5px solid ${eyedropperActive && eyedropperMode === 'remove' ? 'var(--accent-primary)' : 'transparent'}`,
                          color: eyedropperActive && eyedropperMode === 'remove' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        <PipetteIcon />
                        {eyedropperActive && eyedropperMode === 'remove' ? '點擊圖片去除該色' : '滴管去除'}
                      </button>

                      {/* 滴管還原 */}
                      <button
                        onClick={() => {
                          if (eyedropperActive && eyedropperMode === 'restore') {
                            setEyedropperActive(false)
                          } else {
                            setEyedropperMode('restore')
                            setEyedropperActive(true)
                          }
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
                        style={{
                          background: eyedropperActive && eyedropperMode === 'restore' ? 'rgba(168, 181, 160, 0.15)' : 'var(--bg-secondary)',
                          border: `1.5px solid ${eyedropperActive && eyedropperMode === 'restore' ? 'var(--sage)' : 'transparent'}`,
                          color: eyedropperActive && eyedropperMode === 'restore' ? 'var(--sage)' : 'var(--text-secondary)',
                        }}
                      >
                        <PipetteIcon />
                        {eyedropperActive && eyedropperMode === 'restore' ? '點擊圖片還原該色' : '滴管還原'}
                      </button>
                    </div>

                    {/* 去除色列表 */}
                    {customBgColors.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>去除：</span>
                        {customBgColors.map((c, ci) => (
                          <button
                            key={`rm-${ci}`}
                            onClick={async () => {
                              const newColors = customBgColors.filter((_, i) => i !== ci)
                              setCustomBgColors(newColors)
                              if (doneCount > 0) {
                                const cfg = LEVELS[level]
                                const doneImgs = images.filter(i => i.status === 'done')
                                for (const img of doneImgs) {
                                  let resultBlob
                                  if (cfg.type === 'solid') {
                                    const result = await solidColorRemoval(img.file, newColors.length > 0 ? newColors : null)
                                    resultBlob = result.blob
                                    updateImage(img.id, { solidResultBlob: result.blob, bgColor: result.bgColor })
                                  } else if (img.aiResultBlob) {
                                    const bgArr = newColors.length > 0 ? [img.bgColor, ...newColors] : img.bgColor
                                    resultBlob = await protectAiResult(img.file, img.aiResultBlob, bgArr, cfg.protection)
                                  } else continue
                                  if (restoreColors.length > 0) resultBlob = await applyRestore(resultBlob, img.file, restoreColors)
                                  if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
                                  const resultUrl = URL.createObjectURL(resultBlob)
                                  updateImage(img.id, { resultBlob, resultUrl })
                                }
                              }
                            }}
                            title={`rgb(${c.r}, ${c.g}, ${c.b}) — 點擊移除`}
                            className="w-7 h-7 rounded-full relative group transition-transform hover:scale-110"
                            style={{
                              background: `rgb(${c.r},${c.g},${c.b})`,
                              border: '2px solid var(--accent-tertiary)',
                            }}
                          >
                            <span className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '10px' }}
                            >
                              <XIcon />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 還原色列表 */}
                    {restoreColors.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>還原：</span>
                        {restoreColors.map((c, ci) => (
                          <button
                            key={`rs-${ci}`}
                            onClick={async () => {
                              const newRestores = restoreColors.filter((_, i) => i !== ci)
                              setRestoreColors(newRestores)
                              // 需要從底層重新處理（移除 → 還原）
                              if (doneCount > 0) {
                                const cfg = LEVELS[level]
                                const doneImgs = images.filter(i => i.status === 'done')
                                for (const img of doneImgs) {
                                  let resultBlob
                                  if (cfg.type === 'solid') {
                                    const result = await solidColorRemoval(img.file, customBgColors.length > 0 ? customBgColors : null)
                                    resultBlob = result.blob
                                    updateImage(img.id, { solidResultBlob: result.blob, bgColor: result.bgColor })
                                  } else if (img.aiResultBlob) {
                                    const bgArr = customBgColors.length > 0 ? [img.bgColor, ...customBgColors] : img.bgColor
                                    resultBlob = await protectAiResult(img.file, img.aiResultBlob, bgArr, cfg.protection)
                                  } else continue
                                  if (newRestores.length > 0) resultBlob = await applyRestore(resultBlob, img.file, newRestores)
                                  if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
                                  const resultUrl = URL.createObjectURL(resultBlob)
                                  updateImage(img.id, { resultBlob, resultUrl })
                                }
                              }
                            }}
                            title={`rgb(${c.r}, ${c.g}, ${c.b}) — 點擊移除`}
                            className="w-7 h-7 rounded-full relative group transition-transform hover:scale-110"
                            style={{
                              background: `rgb(${c.r},${c.g},${c.b})`,
                              border: '2px solid var(--sage)',
                            }}
                          >
                            <span className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '10px' }}
                            >
                              <XIcon />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 全部清除 */}
                    {(customBgColors.length > 0 || restoreColors.length > 0) && (
                      <button
                        onClick={async () => {
                          setCustomBgColors([])
                          setRestoreColors([])
                          if (doneCount > 0) {
                            const cfg = LEVELS[level]
                            const doneImgs = images.filter(i => i.status === 'done')
                            for (const img of doneImgs) {
                              let resultBlob
                              if (cfg.type === 'solid') {
                                const result = await solidColorRemoval(img.file)
                                resultBlob = result.blob
                                updateImage(img.id, { solidResultBlob: result.blob, bgColor: result.bgColor })
                              } else if (img.aiResultBlob) {
                                resultBlob = await protectAiResult(img.file, img.aiResultBlob, img.bgColor, cfg.protection)
                              } else continue
                              if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
                              const resultUrl = URL.createObjectURL(resultBlob)
                              updateImage(img.id, { resultBlob, resultUrl })
                            }
                          }
                        }}
                        className="text-xs transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        全部清除
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Suggestion banner */}
                {suggestion && (
                  <div
                    className="mt-3 p-3 rounded-xl flex items-center justify-between gap-3"
                    style={{
                      background: 'rgba(212, 165, 165, 0.08)',
                      border: '1px solid rgba(212, 165, 165, 0.2)',
                    }}
                  >
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {suggestion.text}
                    </span>
                    <button
                      onClick={() => {
                        const target = suggestion.target
                        setLevel(target)
                        setSuggestion(null)
                        if (doneCount > 0) recompositeWithLevel(target)
                      }}
                      className="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        color: 'white',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      切換到{LEVELS[suggestion.target].label}
                    </button>
                  </div>
                )}
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

                {doneCount >= 1 && (
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
                    className="relative aspect-square overflow-hidden"
                    onClick={(e) => {
                      if (eyedropperActive) {
                        handleEyedropperPick(e, img)
                      } else if (img.status === 'done') {
                        setPreviewId(previewId === img.id ? null : img.id)
                        setSliderPos(50)
                      }
                    }}
                    style={{
                      background: 'var(--bg-secondary)',
                      cursor: eyedropperActive ? 'crosshair' : 'pointer',
                    }}
                  >
                    <img
                      src={
                        img.status === 'done'
                          ? (eyedropperActive && eyedropperMode === 'restore' ? img.originalUrl : img.resultUrl)
                          : img.originalUrl
                      }
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

                    <div className="flex items-center gap-1.5">
                      {img.status === 'done' && (
                        <button
                          onClick={() => downloadOne(img)}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1"
                          style={{
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                            color: 'white',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <DownloadIcon />
                          存檔
                        </button>
                      )}

                      {!isProcessing && (
                        <button
                          onClick={() => removeImage(img.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
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
