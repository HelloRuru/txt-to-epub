import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import PlatformSelector from '../components/PlatformSelector'
import PostEditor from '../components/PostEditor'
import PostPreview from '../components/PostPreview'
import EmojiPicker from '../components/EmojiPicker'
import TemplateControls from '../components/TemplateControls'
import { DEFAULT_PLATFORM, computeStats } from '../utils/platformLimits'
import { applyTemplate, validateTemplate } from '../utils/templateAdapter'
import { transform } from '../utils/postConverter'
import { copyDecorator } from '../utils/copyDecorator'

// ─── SVG Icons ─────────────────────────────────────────

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const EditIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const TextIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const PasteIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)

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
  const [previewTab, setPreviewTab] = useState('platform') // 'platform' | 'result'
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
                <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="white">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="8" y1="13" x2="16" y2="13"/>
                  <line x1="8" y1="17" x2="12" y2="17"/>
                  <path d="M10 9H8"/>
                </svg>
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
                onChange={(e) => setText(e.target.value)}
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
        ) : (
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
                    onClick={() => setPreviewTab('platform')}
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
                    onClick={() => setPreviewTab('result')}
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
              <div className="flex items-center gap-2 mb-4">
                <EditIcon />
                <span className="text-sm font-medium">編輯區</span>
                <button
                  onClick={handlePaste}
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

              <PostEditor
                value={text}
                onChange={setText}
                placeholder="在這裡輸入或貼上你的貼文..."
                textareaRef={textareaRef}
              />

              <div className="mt-5">
                <EmojiPicker onSelect={handleEmojiInsert} />
              </div>

              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <StatsBar stats={stats} statusColor={statusColor} platform={platform} />
              </div>
            </div>
          </div>
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
        <footer className="mt-12 sm:mt-16 pt-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            全程本機處理，文字不會上傳到任何伺服器
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Kaoru Tsai · <a href="https://helloruru.com" style={{ color: 'var(--accent-primary)' }}>HelloRuru</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

// ─── 統計列子組件 ──────────────────────────────────────

function StatsBar({ stats, statusColor, platform }) {
  if (!stats) return null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {/* 進度條 */}
      <div className="flex-1 min-w-[100px]">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(stats.charPercent, 100)}%`,
              background: statusColor,
            }}
          />
        </div>
      </div>

      {/* 數字 + 標籤 */}
      <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: statusColor, fontWeight: 600 }}>{stats.charCount.toLocaleString()}</span>
        <span>/ {stats.maxChars.toLocaleString()} 字</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{stats.lineCount} 行</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{stats.paragraphCount} 段</span>

        {stats.showMoreTriggered && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,165,50,0.1)', color: '#C8A020' }}>
            超過 5 行將折疊
          </span>
        )}

        {platform === 'instagram' && stats.hashtagCount > 0 && (
          <span
            className="px-2 py-0.5 rounded-full"
            style={{
              background: stats.hashtagOver ? 'rgba(232,85,85,0.1)' : 'rgba(168,181,160,0.15)',
              color: stats.hashtagOver ? '#E85555' : 'var(--sage)',
            }}
          >
            #{stats.hashtagCount}/{stats.hashtagLimit}
          </span>
        )}

        {stats.threadSplits && (
          <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(184,169,201,0.15)', color: 'var(--lavender)' }}>
            建議拆為 {stats.threadSplits.length} 則串文
          </span>
        )}
      </div>
    </div>
  )
}
