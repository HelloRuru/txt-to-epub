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
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const BookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <path d="M8 7h8M8 11h8M8 15h5"/>
  </svg>
)

const BookOpenIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
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

  const stepLabels = ['上傳檔案', '確認章節', '書籍設定', '輸出 EPUB']
  const instructionSteps = [
    { title: '上傳 TXT 檔案', desc: '支援任意大小，全程本機處理' },
    { title: '確認章節與設定', desc: '自動偵測章節，可開啟簡轉繁' },
    { title: '下載 EPUB', desc: '可加入封面，支援直排/橫排' },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-dark-bg to-dark-card' 
        : 'bg-gradient-to-b from-nadeshiko-50 to-nadeshiko-100'
    }`}>
      {/* 頂部導航 */}
      <nav className={`border-b sticky top-0 z-10 backdrop-blur-sm transition-colors ${
        isDark 
          ? 'border-dark-border bg-dark-bg/80' 
          : 'border-nadeshiko-200 bg-nadeshiko-50/80'
      }`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to="/" 
            className={`flex items-center gap-2 transition-colors ${
              isDark 
                ? 'text-nadeshiko-300 hover:text-nadeshiko-200' 
                : 'text-nadeshiko-600 hover:text-nadeshiko-700'
            }`}
          >
            <ArrowLeftIcon />
            <span>返回工具箱</span>
          </Link>
          
          <h1 className={`flex items-center gap-2 text-xl font-medium ${
            isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-800'
          }`}>
            <span className={isDark ? 'text-lavender-300' : 'text-lavender-500'}>
              <BookIcon />
            </span>
            TXT 轉 EPUB
          </h1>
          
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 使用說明 */}
        {step === 1 && (
          <div className={`mb-8 p-6 rounded-3xl border card-hover transition-colors ${
            isDark 
              ? 'bg-dark-card border-dark-border' 
              : 'bg-white/70 border-nadeshiko-200'
          }`}>
            <h2 className={`text-xl mb-2 flex items-center gap-3 ${
              isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
            }`}>
              <span className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDark 
                  ? 'bg-lavender-500/20' 
                  : 'bg-gradient-to-br from-lavender-100 to-nadeshiko-100'
              }`}>
                <BookOpenIcon className={isDark ? 'text-lavender-300' : 'text-lavender-500'} />
              </span>
              使用說明
            </h2>
            <div className="decorative-line mb-4"></div>
            
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              {instructionSteps.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    isDark 
                      ? 'border-nadeshiko-400 text-nadeshiko-400' 
                      : 'border-nadeshiko-400 text-nadeshiko-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className={`font-medium mb-1 ${isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-800'}`}>
                      {item.title}
                    </p>
                    <p className={isDark ? 'text-nadeshiko-400/70' : 'text-nadeshiko-600/70'}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 進度指示 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s 
                    ? 'bg-gradient-to-br from-nadeshiko-400 to-lavender-400 text-white shadow-md' 
                    : isDark 
                      ? 'bg-dark-border text-nadeshiko-600' 
                      : 'bg-nadeshiko-200 text-nadeshiko-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-0.5 mx-1 transition-colors ${
                  step > s 
                    ? 'bg-gradient-to-r from-nadeshiko-400 to-lavender-400' 
                    : isDark ? 'bg-dark-border' : 'bg-nadeshiko-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className={`text-center text-sm mb-8 ${
          isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-600'
        }`}>
          {stepLabels[step - 1]}
        </div>

        {/* 步驟內容 */}
        <div className={`rounded-3xl border p-6 md:p-8 transition-colors ${
          isDark 
            ? 'bg-dark-card border-dark-border' 
            : 'bg-white/80 border-nadeshiko-200 shadow-soft'
        }`}>
          {step === 1 && <FileUploader onUpload={handleFileUpload} />}
          {step === 2 && (
            <ChapterPreview 
              chapters={chapters} 
              setChapters={setChapters}
              fileName={file?.name}
              content={content}
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

        {/* 底部按鈕 */}
        <div className="flex justify-between mt-6">
          <button
            onClick={step === 1 ? undefined : handleBack}
            disabled={step === 1}
            className={`px-6 py-2.5 rounded-full transition-all btn-press flex items-center gap-2 ${
              step === 1 
                ? 'opacity-0 cursor-default' 
                : isDark
                  ? 'bg-dark-border text-nadeshiko-300 hover:bg-nadeshiko-700/30'
                  : 'bg-nadeshiko-100 text-nadeshiko-600 hover:bg-nadeshiko-200'
            }`}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            上一步
          </button>
          
          {step < 4 && (
            <button
              onClick={handleNext}
              disabled={step === 1 && !file}
              className={`px-6 py-2.5 rounded-full transition-all btn-press flex items-center gap-2 ${
                step === 1 && !file
                  ? isDark
                    ? 'bg-dark-border text-nadeshiko-600 cursor-not-allowed'
                    : 'bg-nadeshiko-100 text-nadeshiko-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-nadeshiko-400 to-lavender-400 text-white hover:shadow-lg'
              }`}
            >
              下一步
              <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </div>
      </main>

      {/* 底部 */}
      <footer className={`text-center py-6 text-xs ${
        isDark ? 'text-nadeshiko-700' : 'text-nadeshiko-400'
      }`}>
        <p>© 2026 Kaoru Tsai. All rights reserved.</p>
      </footer>
    </div>
  )
}
