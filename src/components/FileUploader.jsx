import { useCallback, useState } from 'react'
import { readFileWithAutoEncoding } from '../utils/encodingDetector'

// SVG Icons
const FileTextIcon = () => (
  <svg viewBox="0 0 24 24" className="w-12 h-12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const LoaderIcon = () => (
  <svg viewBox="0 0 24 24" className="w-12 h-12 animate-spin" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

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
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 
          className="font-serif text-2xl font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          上傳你的 TXT 檔案
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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="block border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300"
        style={{ 
          borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border)',
          background: isDragging ? 'rgba(212, 165, 165, 0.1)' : 'transparent',
          opacity: loading ? 0.5 : 1,
          pointerEvents: loading ? 'none' : 'auto'
        }}
        onMouseEnter={(e) => {
          if (!isDragging && !loading) {
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
          accept=".txt"
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />
        
        {loading ? (
          <>
            <div 
              className="inline-flex mb-4"
              style={{ color: 'var(--accent-primary)' }}
            >
              <LoaderIcon />
            </div>
            <p 
              className="font-serif font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              正在讀取檔案...
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              偵測編碼中
            </p>
          </>
        ) : (
          <>
            <div 
              className="inline-flex mb-4"
              style={{ color: 'var(--accent-primary)' }}
            >
              <FileTextIcon />
            </div>
            <p 
              className="font-serif font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {isDragging ? '放開以上傳檔案' : '拖放檔案到這裡'}
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              或點擊選擇檔案
            </p>
          </>
        )}
      </label>

      {error && (
        <div 
          className="p-4 rounded-2xl text-sm flex items-center gap-3"
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444'
          }}
        >
          <AlertIcon />
          {error}
        </div>
      )}

      {encodingInfo && (
        <div 
          className="p-4 rounded-2xl text-sm flex items-center gap-3"
          style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)'
          }}
        >
          <SearchIcon style={{ color: 'var(--accent-primary)' }} />
          <span>
            偵測到編碼：
            <strong style={{ color: 'var(--text-primary)' }}>
              {encodingInfo.label}
            </strong>
          </span>
        </div>
      )}

      <div 
        className="text-center text-xs flex items-center justify-center gap-2"
        style={{ color: 'var(--text-muted)' }}
      >
        <InfoIcon style={{ color: 'var(--accent-secondary)' }} />
        <span>支援 UTF-8、GBK（簡體）、Big5（繁體）等常見編碼，自動偵測</span>
      </div>
    </div>
  )
}
