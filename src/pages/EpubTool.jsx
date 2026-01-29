import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import FileUploader from '../components/FileUploader'
import ChapterPreview from '../components/ChapterPreview'
import CoverUploader from '../components/CoverUploader'
import SettingsPanel from '../components/SettingsPanel'
import ExportButton from '../components/ExportButton'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'
import { detectChapters } from '../utils/chapterDetector'

// SVG Icons
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const BookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const ListIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

export default function EpubTool() {
  const { isDark } = useTheme()
  const [file, setFile] = useState(null)
  const [content, setContent] = useState('')
  const [chapters, setChapters] = useState([])
  const [cover, setCover] = useState(null)
  const [settings, setSettings] = useState({
    title: '',
    author: '',
    convertToTraditional: true,
    writingMode: 'horizontal',
    fontFamily: 'noto-sans',
    embedFont: false,
    fontSize: 'medium',
    lineHeight: 'normal',
    textIndent: 'two',
  })
  const [step, setStep] = useState(1)

  const handleFileUpload = useCallback(async (uploadedFile, text) => {
    setFile(uploadedFile)
    setContent(text)
    const detectedChapters = detectChapters(text)
    setChapters(detectedChapters)
    const fileName = uploadedFile.name.replace(/\.txt$/i, '')
    setSettings(prev => ({ ...prev, title: fileName }))
    setStep(2)
  }, [])

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleReset = () => {
    setFile(null)
    setContent('')
    setChapters([])
    setCover(null)
    setSettings({
      title: '',
      author: '',
      convertToTraditional: true,
      writingMode: 'horizontal',
      fontFamily: 'noto-sans',
      embedFont: false,
      fontSize: 'medium',
      lineHeight: 'normal',
      textIndent: 'two',
    })
    setStep(1)
  }

  const steps = [
    { num: 1, label: '上傳檔案', icon: <UploadIcon /> },
    { num: 2, label: '確認章節', icon: <ListIcon /> },
    { num: 3, label: '書籍設定', icon: <SettingsIcon /> },
    { num: 4, label: '輸出 EPUB', icon: <DownloadIcon /> },
  ]

  const instructions = [
    { num: '1', title: '上傳 TXT 檔案', desc: '支援任意大小，全程本機處理' },
    { num: '2', title: '確認章節與設定', desc: '自動偵測章節，可開啟簡轉繁' },
    { num: '3', title: '下載 EPUB', desc: '可加入封面，支援直排/橫排' },
  ]

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ 
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Header */}
      <nav 
        className="sticky top-0 z-10 backdrop-blur-md transition-colors"
        style={{ 
          borderBottom: '1px solid var(--border)',
          background: isDark ? 'rgba(30, 26, 29, 0.8)' : 'rgba(255, 252, 250, 0.8)'
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
            <BookIcon style={{ color: 'var(--accent-primary)' }} />
            TXT 轉 EPUB
          </h1>
          
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Instructions */}
        {step === 1 && (
          <div 
            className="mb-10 p-8 rounded-3xl transition-all"
            style={{ 
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <h2 
              className="font-serif text-xl font-semibold mb-6 flex items-center gap-3"
              style={{ color: 'var(--text-primary)' }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center icon-container rose"
                style={{ color: 'var(--rose)' }}
              >
                <BookIcon />
              </div>
              使用說明
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {instructions.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      color: 'white'
                    }}
                  >
                    {item.num}
                  </div>
                  <div>
                    <p 
                      className="font-serif font-medium mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.title}
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                style={{ 
                  background: step >= s.num 
                    ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' 
                    : 'var(--bg-secondary)',
                  color: step >= s.num ? 'white' : 'var(--text-muted)',
                  boxShadow: step >= s.num ? '0 4px 16px rgba(212, 165, 165, 0.3)' : 'none'
                }}
              >
                {s.num}
              </div>
              {i < steps.length - 1 && (
                <div 
                  className="w-16 h-0.5 mx-2 transition-colors rounded-full"
                  style={{ 
                    background: step > s.num 
                      ? 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' 
                      : 'var(--border)'
                  }} 
                />
              )}
            </div>
          ))}
        </div>
        
        <div 
          className="text-center text-sm mb-8"
          style={{ color: 'var(--text-muted)' }}
        >
          {steps.find(s => s.num === step)?.label}
        </div>

        {/* Main Content */}
        <div 
          className="rounded-3xl p-8 md:p-10 transition-all"
          style={{ 
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}
        >
          {step === 1 && <FileUploader onUpload={handleFileUpload} />}
          {step === 2 && (
            <ChapterPreview 
              chapters={chapters} 
              setChapters={setChapters}
              fileName={file?.name}
            />
          )}
          {step === 3 && (
            <div className="space-y-8">
              <SettingsPanel settings={settings} setSettings={setSettings} />
              <CoverUploader cover={cover} setCover={setCover} />
            </div>
          )}
          {step === 4 && (
            <ExportButton
              content={content}
              chapters={chapters}
              cover={cover}
              settings={settings}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={step === 1 ? undefined : handleBack}
            disabled={step === 1}
            className="px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2"
            style={{ 
              opacity: step === 1 ? 0 : 1,
              cursor: step === 1 ? 'default' : 'pointer',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              if (step !== 1) {
                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                e.currentTarget.style.color = 'var(--accent-primary)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <ArrowLeftIcon />
            上一步
          </button>
          
          {step < 4 && (
            <button
              onClick={handleNext}
              disabled={step === 1 && !file}
              className="px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2"
              style={{ 
                background: (step === 1 && !file) 
                  ? 'var(--bg-secondary)' 
                  : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: (step === 1 && !file) ? 'var(--text-muted)' : 'white',
                cursor: (step === 1 && !file) ? 'not-allowed' : 'pointer',
                boxShadow: (step === 1 && !file) ? 'none' : '0 4px 16px rgba(212, 165, 165, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!(step === 1 && !file)) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              下一步
              <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="text-center py-8 text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        <p>Built with curiosity at HelloRuru</p>
      </footer>
    </div>
  )
}
