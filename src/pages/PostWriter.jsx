import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import PlatformSelector from '../components/PlatformSelector'
import PostEditor from '../components/PostEditor'
import PostPreview from '../components/PostPreview'
import EmojiPicker from '../components/EmojiPicker'
import TemplateControls from '../components/TemplateControls'
import StatsBar from '../components/StatsBar'
import {
  CopyIcon, CheckIcon, ZapIcon, EditIcon,
  EyeIcon, TextIcon, PasteIcon, HeaderIcon,
} from '../components/PostIcons'
import { DEFAULT_PLATFORM, computeStats } from '../utils/platformLimits'
import { applyTemplate, validateTemplate } from '../utils/templateAdapter'
import { transform } from '../utils/postConverter'
import { copyDecorator } from '../utils/copyDecorator'

// ─── 主組件 ────────────────────────────────────────────

export default function PostWriter() {
  const [text, setText] = useState('')
  const [platform, setPlatform] = useState(DEFAULT_PLATFORM)
  const [mode, setMode] = useState('original')
  const [viewMode, setViewMode] = useState('editor')
  const [titleStyle, setTitleStyle] = useState('checkerboard')
  const [fullWidthPunctuation, setFullWidthPunctuation] = useState(false)
  const [sentenceCase, setSentenceCase] = useState(false)
  const [titleDetect, setTitleDetect] = useState('auto')
  const [manualTitle, setManualTitle] = useState('')
  const [fullWidthDigit, setFullWidthDigit] = useState(false)
  const [copyState, setCopyState] = useState('idle')
  const [previewTab, setPreviewTab] = useState('platform')
  const textareaRef = useRef(null)

  const templateOptions = useMemo(() => ({
    titleStyle, titleDetect, manualTitle, fullWidthPunctuation, sentenceCase, fullWidthDigit,
  }), [titleStyle, titleDetect, manualTitle, fullWidthPunctuation, sentenceCase, fullWidthDigit])

  const transformed = useMemo(() => {
    const templated = applyTemplate(text, mode, templateOptions)
    return transform(templated, platform)
  }, [text, mode, platform, templateOptions])

  const validation = useMemo(() => validateTemplate(text, mode), [text, mode])
  const stats = useMemo(() => computeStats(text, platform), [text, platform])

  const handleEmojiInsert = useCallback((emoji) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      setText(prev => prev.slice(0, start) + emoji + prev.slice(end))
      requestAnimationFrame(() => {
        const pos = start + emoji.length
        textarea.selectionStart = pos
        textarea.selectionEnd = pos
        textarea.focus()
      })
    } else {
      setText(prev => prev + emoji)
    }
  }, [])

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (clip) setText(clip)
    } catch { /* 權限被拒 */ }
  }, [])

  const handleCopy = useCallback(async () => {
    const result = await copyDecorator(text, platform, mode, templateOptions)
    if (result.success) {
      setCopyState('success')
      setTimeout(() => setCopyState('idle'), 1500)
    }
  }, [text, platform, mode, templateOptions])

  const statusColor = stats?.status === 'red'
    ? '#E85555' : stats?.status === 'yellow' ? '#D4A520' : 'var(--accent-primary)'

  return (
    <div
      className="min-h-screen transition-colors duration-500 relative"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">

        {/* ═══ Header ═══════════════════════════════════ */}
        <header className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-4">
            <Link to="/" className="group flex items-center">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-[-15deg] group-hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  boxShadow: '0 4px 20px rgba(212, 165, 165, 0.3)',
                }}
              >
                <HeaderIcon />
              </div>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-wide">社群貼文排版</h1>
              <div
                className="text-xs font-medium tracking-widest uppercase mt-0.5"
                style={{ color: 'var(--accent-primary)' }}
              >
                HelloRuru
              </div>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* ═══ 工具列區塊 ═══════════════════════════════ */}
        <div
          className="rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8 space-y-5"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          {/* 第一列：快速/編輯器 + 平台選擇 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className="flex rounded-xl p-0.5 self-start"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setViewMode('quick')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: viewMode === 'quick' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'quick' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'quick' ? 'var(--shadow)' : 'none',
                }}
              >
                <ZapIcon /> 快速模式
              </button>
              <button
                onClick={() => setViewMode('editor')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: viewMode === 'editor' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'editor' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'editor' ? 'var(--shadow)' : 'none',
                }}
              >
                <EditIcon /> 編輯器模式
              </button>
            </div>

            <div className="flex-1">
              <div className="text-[10px] mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                目標平台
              </div>
              <PlatformSelector value={platform} onChange={setPlatform} />
            </div>
          </div>

          {/* 分隔線 */}
          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* 第二列：排版模板 */}
          <div>
            <div className="text-[10px] mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
              排版模板
            </div>
            <TemplateControls
              mode={mode}
              onModeChange={setMode}
              titleStyle={titleStyle}
              onTitleStyleChange={setTitleStyle}
              titleDetect={titleDetect}
              onTitleDetectChange={setTitleDetect}
              manualTitle={manualTitle}
              onManualTitleChange={setManualTitle}
              fullWidthPunctuation={fullWidthPunctuation}
              onFullWidthPunctuationChange={() => setFullWidthPunctuation(prev => !prev)}
              sentenceCase={sentenceCase}
              onSentenceCaseChange={() => setSentenceCase(prev => !prev)}
              fullWidthDigit={fullWidthDigit}
              onFullWidthDigitChange={() => setFullWidthDigit(prev => !prev)}
              warnings={validation.warnings}
            />
          </div>
        </div>

        {/* ═══ 主內容區 ═══════════════════════════════════ */}
        {viewMode === 'quick' ? (
          <QuickMode
            text={text}
            onTextChange={setText}
            stats={stats}
            statusColor={statusColor}
            platform={platform}
          />
        ) : (
          <EditorMode
            text={text}
            onTextChange={setText}
            transformed={transformed}
            platform={platform}
            stats={stats}
            statusColor={statusColor}
            previewTab={previewTab}
            onPreviewTabChange={setPreviewTab}
            textareaRef={textareaRef}
            onEmojiInsert={handleEmojiInsert}
            onPaste={handlePaste}
          />
        )}

        {/* ═══ 複製按鈕 ═══════════════════════════════════ */}
        <div className="mt-8 sm:mt-10 flex justify-center lg:justify-start px-4">
          <button
            onClick={handleCopy}
            disabled={!text}
            className="inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: copyState === 'success'
                ? 'linear-gradient(135deg, #A8B5A0, #8FA888)'
                : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              color: 'white',
              boxShadow: '0 4px 20px rgba(212,165,165,0.3)',
            }}
          >
            {copyState === 'success' ? (
              <><CheckIcon /> 已複製！</>
            ) : (
              <><CopyIcon /> 複製轉換結果</>
            )}
          </button>
        </div>

        {/* Toast */}
        {copyState === 'success' && (
          <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm font-medium animate-fadeInUp z-50"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-hover)',
              color: 'var(--text-primary)',
            }}
          >
            已複製到剪貼簿 — 直接到 {platform === 'facebook' ? 'FB' : platform === 'instagram' ? 'IG' : 'Threads'} 貼上即可
          </div>
        )}

        {/* ═══ Footer ═══════════════════════════════════ */}
        <footer className="mt-24 sm:mt-32 pt-12 pb-8 text-center">
          {/* 裝飾分隔 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'var(--border)' }} />
            <span className="text-xs tracking-widest" style={{ color: 'var(--border)' }}>✦</span>
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'var(--border)' }} />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            全程本機處理，文字不會上傳到任何伺服器
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            © {new Date().getFullYear()} Kaoru Tsai · <a href="https://helloruru.com" style={{ color: 'var(--accent-primary)' }}>HelloRuru</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

// ─── 快速模式 ─────────────────────────────────────────

function QuickMode({ text, onTextChange, stats, statusColor, platform }) {
  return (
    <div className="animate-fadeInUp">
      <div
        className="rounded-3xl p-6 sm:p-8"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="貼上你的文字，一鍵轉換..."
          className="w-full resize-none p-4 sm:p-5 rounded-2xl text-sm leading-relaxed outline-none transition-all duration-300 focus:ring-2"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: "'GenSenRounded', 'Noto Sans TC', sans-serif",
            fontWeight: 500,
            minHeight: '280px',
            '--tw-ring-color': 'var(--accent-primary)',
          }}
          spellCheck={false}
        />
        <div className="mt-4">
          <StatsBar stats={stats} statusColor={statusColor} platform={platform} />
        </div>
      </div>
    </div>
  )
}

// ─── 編輯器模式 ───────────────────────────────────────

function EditorMode({
  text, onTextChange, transformed, platform,
  stats, statusColor, previewTab, onPreviewTabChange,
  textareaRef, onEmojiInsert, onPaste,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 animate-fadeInUp">
      {/* 左：預覽區 */}
      <div
        className="rounded-3xl p-5 sm:p-7"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* 預覽標籤切換 */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex rounded-lg p-0.5"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => onPreviewTabChange('platform')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
              style={{
                background: previewTab === 'platform' ? 'var(--bg-card)' : 'transparent',
                color: previewTab === 'platform' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: previewTab === 'platform' ? 'var(--shadow)' : 'none',
              }}
            >
              <EyeIcon /> 平台模擬
            </button>
            <button
              onClick={() => onPreviewTabChange('result')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
              style={{
                background: previewTab === 'result' ? 'var(--bg-card)' : 'transparent',
                color: previewTab === 'result' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: previewTab === 'result' ? 'var(--shadow)' : 'none',
              }}
            >
              <TextIcon /> 轉換結果
            </button>
          </div>
        </div>

        {previewTab === 'platform' ? (
          <PostPreview text={transformed} platform={platform} />
        ) : (
          <div
            className="rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-auto"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: "'GenSenRounded', 'Noto Sans TC', sans-serif",
              minHeight: '240px',
              maxHeight: '500px',
            }}
          >
            {transformed || <span style={{ color: 'var(--text-muted)' }}>轉換結果將在這裡顯示...</span>}
          </div>
        )}
      </div>

      {/* 右：編輯區 */}
      <div
        className="rounded-3xl p-5 sm:p-7"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <EditIcon />
          <span className="text-sm font-medium">編輯區</span>
          <button
            onClick={onPaste}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <PasteIcon /> 貼上
          </button>
        </div>

        <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <StatsBar stats={stats} statusColor={statusColor} platform={platform} />
        </div>

        <PostEditor
          value={text}
          onChange={onTextChange}
          placeholder="在這裡輸入或貼上你的貼文..."
          textareaRef={textareaRef}
        />

        <div className="mt-5">
          <EmojiPicker onSelect={onEmojiInsert} />
        </div>

      </div>
    </div>
  )
}
