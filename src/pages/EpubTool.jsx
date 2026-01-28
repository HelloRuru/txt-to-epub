import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import FileUploader from '../components/FileUploader'
import ChapterPreview from '../components/ChapterPreview'
import CoverUploader from '../components/CoverUploader'
import SettingsPanel from '../components/SettingsPanel'
import ExportButton from '../components/ExportButton'
import { detectChapters } from '../utils/chapterDetector'

export default function EpubTool() {
  const [file, setFile] = useState(null)
  const [content, setContent] = useState('')
  const [chapters, setChapters] = useState([])
  const [cover, setCover] = useState(null)
  const [settings, setSettings] = useState({
    title: '',
    author: '',
    convertToTraditional: true,
    writingMode: 'horizontal', // horizontal | vertical
  })
  const [step, setStep] = useState(1) // 1: 上傳, 2: 預覽, 3: 設定, 4: 輸出

  const handleFileUpload = useCallback(async (uploadedFile, text) => {
    setFile(uploadedFile)
    setContent(text)
    
    // 自動偵測章節
    const detectedChapters = detectChapters(text)
    setChapters(detectedChapters)
    
    // 從檔名推測書名
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
    })
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1612] to-[#2a2420]">
      {/* 頂部導航 */}
      <nav className="border-b border-warm-700/30 bg-[#1a1612]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-warm-400 hover:text-cream transition-colors flex items-center gap-2">
            <span>←</span>
            <span>返回工具箱</span>
          </Link>
          <h1 className="font-serif text-xl text-cream">TXT 轉 EPUB</h1>
          <div className="w-24"></div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 使用說明（首次進入顯示） */}
        {step === 1 && (
          <div className="mb-8 p-6 rounded-2xl bg-[#2a2420] border border-warm-700/30">
            <h2 className="font-serif text-xl text-cream mb-4 flex items-center gap-2">
              <span>📖</span> 使用說明
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="flex gap-3">
                <span className="text-2xl">①</span>
                <div>
                  <p className="text-cream font-medium mb-1">上傳 TXT 檔案</p>
                  <p className="text-warm-400/80">支援任意大小，全程本機處理不上傳</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">②</span>
                <div>
                  <p className="text-cream font-medium mb-1">確認章節與設定</p>
                  <p className="text-warm-400/80">自動偵測章節，可開啟簡轉繁</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">③</span>
                <div>
                  <p className="text-cream font-medium mb-1">下載 EPUB</p>
                  <p className="text-warm-400/80">可加入封面，支援直排/橫排</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 進度指示 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${step >= s 
                    ? 'bg-warm-500 text-cream' 
                    : 'bg-warm-700/30 text-warm-400/50'
                  }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-0.5 mx-1 ${step > s ? 'bg-warm-500' : 'bg-warm-700/30'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-warm-400/80 text-sm mb-8">
          {step === 1 && '上傳檔案'}
          {step === 2 && '確認章節'}
          {step === 3 && '書籍設定'}
          {step === 4 && '輸出 EPUB'}
        </div>

        {/* 步驟內容 */}
        <div className="bg-[#2a2420] rounded-2xl border border-warm-700/30 p-6 md:p-8">
          {step === 1 && (
            <FileUploader onUpload={handleFileUpload} />
          )}

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

        {/* 底部按鈕 */}
        <div className="flex justify-between mt-6">
          <button
            onClick={step === 1 ? undefined : handleBack}
            disabled={step === 1}
            className={`px-6 py-2 rounded-xl transition-all
              ${step === 1 
                ? 'opacity-0 cursor-default' 
                : 'bg-warm-700/30 text-warm-400 hover:bg-warm-700/50'
              }`}
          >
            ← 上一步
          </button>
          
          {step < 4 && (
            <button
              onClick={handleNext}
              disabled={step === 1 && !file}
              className={`px-6 py-2 rounded-xl transition-all
                ${step === 1 && !file
                  ? 'bg-warm-700/20 text-warm-400/50 cursor-not-allowed'
                  : 'bg-warm-500 text-cream hover:bg-warm-400'
                }`}
            >
              下一步 →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
