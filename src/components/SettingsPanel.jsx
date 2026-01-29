import { useState, useEffect } from 'react'
import { FONT_CONFIG, DEFAULT_FONT } from '../utils/fontSubset'
import { FILENAME_FORMATS, CUSTOM_BLOCKS, loadFilenamePrefs, saveFilenamePrefs, generateFilename } from '../utils/filenameFormat'

// SVG Icons
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const SmartphoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)

const PackageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function SettingsPanel({ settings, setSettings }) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filenamePrefs, setFilenamePrefs] = useState(loadFilenamePrefs)

  useEffect(() => {
    saveFilenamePrefs(filenamePrefs)
    setSettings(prev => ({
      ...prev,
      filenameFormat: filenamePrefs.format,
      filenameIncludeDate: filenamePrefs.includeDate,
      filenameCustomTemplate: filenamePrefs.customTemplate,
      filenameCustomBlocks: filenamePrefs.customBlocks,
      exporter: filenamePrefs.exporter,
    }))
  }, [filenamePrefs, setSettings])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleFilenameFormatChange = (format) => {
    setFilenamePrefs(prev => ({ ...prev, format }))
  }

  // 方塊操作
  const addBlock = (blockId) => {
    setFilenamePrefs(prev => ({
      ...prev,
      customBlocks: [...prev.customBlocks, blockId]
    }))
  }

  const removeBlock = (index) => {
    setFilenamePrefs(prev => ({
      ...prev,
      customBlocks: prev.customBlocks.filter((_, i) => i !== index)
    }))
  }

  const selectedFont = FONT_CONFIG[settings.fontFamily] || FONT_CONFIG[DEFAULT_FONT]

  const previewFilename = generateFilename({
    title: settings.title || '書名',
    author: settings.author || '',
    exporter: filenamePrefs.exporter || '',
    format: filenamePrefs.format,
    includeDate: filenamePrefs.includeDate,
    customTemplate: filenamePrefs.customTemplate,
    customBlocks: filenamePrefs.customBlocks,
  })

  const OptionButton = ({ isActive, onClick, children, className = '' }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left transition-all ${className}`}
      style={{
        borderColor: isActive ? 'var(--accent-primary)' : 'var(--border)',
        background: isActive ? 'rgba(212, 165, 165, 0.1)' : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.borderColor = 'var(--accent-secondary)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {children}
    </button>
  )

  const SmallButton = ({ isActive, onClick, children }) => (
    <button
      onClick={onClick}
      className="py-2 px-3 rounded-xl border text-sm transition-all"
      style={{
        borderColor: isActive ? 'var(--accent-primary)' : 'var(--border)',
        background: isActive ? 'rgba(212, 165, 165, 0.1)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.borderColor = 'var(--accent-secondary)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {children}
    </button>
  )

  // 取得方塊的顯示標籤
  const getBlockLabel = (blockId) => {
    const block = CUSTOM_BLOCKS.find(b => b.id === blockId)
    return block ? block.label : blockId
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, rgba(212, 165, 165, 0.2), rgba(212, 165, 165, 0.1))',
            color: 'var(--rose)'
          }}
        >
          <SettingsIcon />
        </div>
        <h3 
          className="font-serif text-lg font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          書籍設定
        </h3>
      </div>

      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            書名
          </label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="輸入書名"
            className="w-full px-4 py-3 rounded-2xl border transition-colors focus:outline-none"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              caretColor: 'var(--accent-primary)'
            }}
          />
        </div>

        <div className="space-y-2">
          <label 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            作者
          </label>
          <input
            type="text"
            value={settings.author}
            onChange={(e) => handleChange('author', e.target.value)}
            placeholder="輸入作者名稱（選填）"
            className="w-full px-4 py-3 rounded-2xl border transition-colors focus:outline-none"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              caretColor: 'var(--accent-primary)'
            }}
          />
        </div>
      </div>

      {/* Exporter - 只在自訂格式或需要時顯示 */}
      <div className="space-y-2">
        <label 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          輸出者（選填）
        </label>
        <input
          type="text"
          value={filenamePrefs.exporter}
          onChange={(e) => setFilenamePrefs(prev => ({ ...prev, exporter: e.target.value }))}
          placeholder="你的名字，用於檔名顯示"
          className="w-full px-4 py-3 rounded-2xl border transition-colors focus:outline-none"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            caretColor: 'var(--accent-primary)'
          }}
        />
        <p 
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          可在自訂檔名格式中使用
        </p>
      </div>

      {/* Filename Format */}
      <div 
        className="space-y-4 p-5 rounded-2xl"
        style={{ 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)'
        }}
      >
        <div>
          <p 
            className="font-serif font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            輸出檔名格式
          </p>
          <p 
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            選擇偏好的檔名格式，設定會自動記住
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {FILENAME_FORMATS.filter(f => f.id !== 'custom').map((fmt) => (
            <SmallButton
              key={fmt.id}
              isActive={filenamePrefs.format === fmt.id}
              onClick={() => handleFilenameFormatChange(fmt.id)}
            >
              {fmt.label}
            </SmallButton>
          ))}
        </div>

        <SmallButton
          isActive={filenamePrefs.format === 'custom'}
          onClick={() => handleFilenameFormatChange('custom')}
        >
          自訂格式
        </SmallButton>

        {/* 自訂格式方塊 UI */}
        {filenamePrefs.format === 'custom' && (
          <div className="space-y-4">
            {/* 已選方塊 */}
            <div className="space-y-2">
              <p 
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                檔名組成（點擊移除）
              </p>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl" style={{ background: 'var(--bg-card)' }}>
                {filenamePrefs.customBlocks.length === 0 ? (
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    請點擊下方方塊加入
                  </span>
                ) : (
                  filenamePrefs.customBlocks.map((blockId, index) => (
                    <span key={index}>
                      {index > 0 && (
                        <span 
                          className="mx-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          _
                        </span>
                      )}
                      <button
                        onClick={() => removeBlock(index)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all"
                        style={{
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                          color: 'white'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {getBlockLabel(blockId)}
                        <XIcon />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* 可選方塊 */}
            <div className="space-y-2">
              <p 
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                點擊加入
              </p>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_BLOCKS.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => addBlock(block.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-secondary)',
                      background: 'transparent'
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
                    <PlusIcon />
                    {block.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {filenamePrefs.format !== 'title-date' && filenamePrefs.format !== 'custom' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filenamePrefs.includeDate}
              onChange={(e) => setFilenamePrefs(prev => ({ ...prev, includeDate: e.target.checked }))}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              加上轉換日期
            </span>
          </label>
        )}

        <div 
          className="p-3 rounded-xl"
          style={{ background: 'var(--bg-card)' }}
        >
          <p 
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            預覽：
          </p>
          <p 
            className="font-serif font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {previewFilename}.epub
          </p>
        </div>
      </div>

      {/* Convert Toggle */}
      <div 
        className="flex items-center justify-between p-5 rounded-2xl"
        style={{ 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)'
        }}
      >
        <div>
          <p 
            className="font-serif font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            簡體轉繁體
          </p>
          <p 
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            使用 OpenCC 繁化姬引擎，含詞彙轉換
          </p>
        </div>
        <button
          onClick={() => handleChange('convertToTraditional', !settings.convertToTraditional)}
          className="relative w-14 h-8 rounded-full transition-colors"
          style={{ 
            background: settings.convertToTraditional 
              ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' 
              : 'var(--border)'
          }}
        >
          <span
            className="absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform"
            style={{ left: settings.convertToTraditional ? '1.75rem' : '0.25rem' }}
          />
        </button>
      </div>

      {/* Writing Mode */}
      <div className="space-y-3">
        <p 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          排版方向
        </p>
        <div className="flex gap-4">
          {[
            { id: 'horizontal', label: '橫排 →', desc: '現代閱讀習慣，由左至右' },
            { id: 'vertical', label: '直排 ↓', desc: '傳統中文，由上至下' },
          ].map((mode) => (
            <OptionButton
              key={mode.id}
              isActive={settings.writingMode === mode.id}
              onClick={() => handleChange('writingMode', mode.id)}
              className="flex-1"
            >
              <p 
                className="font-serif font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {mode.label}
              </p>
              <p 
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {mode.desc}
              </p>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Font Selection */}
      <div className="space-y-3">
        <p 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          字型風格
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(FONT_CONFIG).map((font) => (
            <OptionButton
              key={font.id}
              isActive={settings.fontFamily === font.id}
              onClick={() => handleChange('fontFamily', font.id)}
            >
              <p 
                className="font-serif font-medium text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                {font.name}
              </p>
              <p 
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {font.description}
              </p>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Font Embed Options */}
      <div 
        className="space-y-3 p-5 rounded-2xl"
        style={{ 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)'
        }}
      >
        <p 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          字型處理方式
        </p>
        
        <OptionButton
          isActive={!settings.embedFont}
          onClick={() => handleChange('embedFont', false)}
          className="w-full"
        >
          <div className="flex items-start gap-3">
            <SmartphoneIcon style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
            <div>
              <p 
                className="font-serif font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                使用閱讀器字型
              </p>
              <p 
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                檔案較小。電子書會建議使用「{selectedFont.name}」，但實際顯示取決於閱讀器設定。
              </p>
            </div>
          </div>
        </OptionButton>

        <OptionButton
          isActive={settings.embedFont}
          onClick={() => handleChange('embedFont', true)}
          className="w-full"
        >
          <div className="flex items-start gap-3">
            <PackageIcon style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <div>
              <p 
                className="font-serif font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                嵌入字型（子集化）
              </p>
              <p 
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                只保留書中用到的字，檔案約 +300KB~1MB。無論在哪個閱讀器都顯示「{selectedFont.name}」。
              </p>
              <p 
                className="text-xs mt-2 flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <ZapIcon style={{ color: 'var(--accent-secondary)' }} />
                首次使用需下載完整字型（約 5~20MB），之後會自動快取
              </p>
            </div>
          </div>
        </OptionButton>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full p-4 rounded-2xl border transition-all flex items-center justify-center gap-2"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <span>{showAdvanced ? '收起' : '展開'}進階排版選項</span>
        <span 
          className="transition-transform"
          style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div 
          className="space-y-6 p-5 rounded-2xl"
          style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)'
          }}
        >
          
          {/* Font Size */}
          <div className="space-y-3">
            <p 
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              字體大小
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'small', name: '小', desc: '適合大螢幕' },
                { id: 'medium', name: '中', desc: '一般閱讀' },
                { id: 'large', name: '大', desc: '輕鬆閱讀' },
                { id: 'xlarge', name: '特大', desc: '護眼模式' },
              ].map((size) => (
                <SmallButton
                  key={size.id}
                  isActive={settings.fontSize === size.id}
                  onClick={() => handleChange('fontSize', size.id)}
                >
                  <div className="text-center">
                    <p className="font-medium">{size.name}</p>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {size.desc}
                    </p>
                  </div>
                </SmallButton>
              ))}
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-3">
            <p 
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              行距
            </p>
            <div className="flex gap-2">
              {[
                { id: 'compact', name: '緊湊' },
                { id: 'normal', name: '適中' },
                { id: 'relaxed', name: '寬鬆' },
                { id: 'loose', name: '特寬' },
              ].map((lh) => (
                <SmallButton
                  key={lh.id}
                  isActive={settings.lineHeight === lh.id}
                  onClick={() => handleChange('lineHeight', lh.id)}
                >
                  {lh.name}
                </SmallButton>
              ))}
            </div>
          </div>

          {/* Text Indent */}
          <div className="space-y-3">
            <p 
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              段落首行縮排
            </p>
            <div className="flex gap-2">
              {[
                { id: 'none', name: '無' },
                { id: 'one', name: '1字' },
                { id: 'two', name: '2字' },
              ].map((indent) => (
                <SmallButton
                  key={indent.id}
                  isActive={settings.textIndent === indent.id}
                  onClick={() => handleChange('textIndent', indent.id)}
                >
                  {indent.name}
                </SmallButton>
              ))}
            </div>
          </div>

          <p 
            className="text-xs flex items-center gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <InfoIcon style={{ color: 'var(--accent-secondary)' }} />
            這些設定會寫入電子書，但部分閱讀器可能會用自己的設定覆蓋
          </p>
        </div>
      )}
    </div>
  )
}
