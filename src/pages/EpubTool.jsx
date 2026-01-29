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
            <span>←</span>
            <span>返回工具箱</span>
          </Link>
          
          <h1 className={`text-xl font-medium ${
            isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-800'
          }`}>
            ✿ TXT 轉 EPUB
          </h1>
          
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 使用說明 */}
        {step === 1 && (
          <div className={`mb-8 p-6 rounded-2xl border card-hover transition-colors ${
            isDark 
              ? 'bg-dark-card border-dark-border' 
              : 'bg-white/70 border-nadeshiko-200'
          }`}>
            <h2 className={`text-xl mb-2 flex items-center gap-2 ${
              isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
            }`}>
              <span>📖</span> 使用說明
            </h2>
            <div className="decorative-line mb-4"></div>
            
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              {[
                { icon: '①', title: '上傳 TXT 檔案', desc: '支援任意大小，全程本機處理' },
                { icon: '②', title: '確認章節與設定', desc: '自動偵測章節，可開啟簡轉繁' },
                { icon: '③', title: '下載 EPUB', desc: '可加入封面，支援直排/橫排' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className={`text-2xl ${isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-500'}`}>
                    {item.icon}
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s 
                    ? 'bg-nadeshiko-400 text-white' 
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
                    ? 'bg-nadeshiko-400' 
                    : isDark ? 'bg-dark-border' : 'bg-nadeshiko-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className={`text-center text-sm mb-8 ${
          isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-600'
        }`}>
          {step === 1 && '上傳檔案'}
          {step === 2 && '確認章節'}
          {step === 3 && '書籍設定'}
          {step === 4 && '輸出 EPUB'}
        </div>

        {/* 步驟內容 */}
        <div className={`rounded-2xl border p-6 md:p-8 transition-colors ${
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
            className={`px-6 py-2 rounded-xl transition-all btn-press ${
              step === 1 
                ? 'opacity-0 cursor-default' 
                : isDark
                  ? 'bg-dark-border text-nadeshiko-300 hover:bg-nadeshiko-700/30'
                  : 'bg-nadeshiko-100 text-nadeshiko-600 hover:bg-nadeshiko-200'
            }`}
          >
            ← 上一步
          </button>
          
          {step < 4 && (
            <button
              onClick={handleNext}
              disabled={step === 1 && !file}
              className={`px-6 py-2 rounded-xl transition-all btn-press ${
                step === 1 && !file
                  ? isDark
                    ? 'bg-dark-border text-nadeshiko-600 cursor-not-allowed'
                    : 'bg-nadeshiko-100 text-nadeshiko-300 cursor-not-allowed'
                  : 'bg-nadeshiko-400 text-white hover:bg-nadeshiko-500 shadow-soft'
              }`}
            >
              下一步 →
            </button>
          )}
        </div>
      </main>

      {/* 底部裝飾 */}
      <footer className={`text-center py-6 text-xs ${
        isDark ? 'text-nadeshiko-700' : 'text-nadeshiko-400'
      }`}>
        <p>✿ 製作於 HelloRuru 工具箱 ✿</p>
      </footer>
    </div>
  )
}
