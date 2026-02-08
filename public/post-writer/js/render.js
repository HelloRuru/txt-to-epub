/**
 * render.js — 社群貼文排版 UI 渲染
 *
 * 所有 HTML 皆以 template literals 產生，無 React / JSX。
 * 互動元素統一使用 data-action 屬性做事件委派。
 * CSS 類名遵循 style.css 的 BEM 命名。
 */

import { icons } from './icons.js'
import {
  PLATFORMS,
  TEMPLATE_MODES,
  TITLE_STYLE_OPTIONS,
  TITLE_DETECT_OPTIONS,
  computeStats,
  applyTemplate,
  validateTemplate,
} from './platforms.js'
import { toPreviewHtml } from './converter.js'

// ─── 常數 ─────────────────────────────────────────────

const SEPARATORS = ['───────', '═══════', '◆◆◆◆◆', '✦ ✦ ✦', '- - - -', '▪ ▪ ▪ ▪']

const DEVICE_WIDTHS = {
  ios: '390px',
  android: '360px',
  desktop: '100%',
}

// ─── 1. renderApp ─────────────────────────────────────

export function renderApp(state, data) {
  return `
    ${renderToolbar(state)}
    <div class="main-content">
      ${state.viewMode === 'quick'
        ? renderQuickMode(state, data)
        : renderEditorMode(state, data)}
    </div>
  `
}

// ─── 2. renderToolbar ─────────────────────────────────

export function renderToolbar(state) {
  return `
    <div class="toolbar">
      <div class="toolbar__row">
        ${renderViewModeSwitcher(state)}
        <button class="theme-toggle" data-action="toggle-theme" aria-label="切換深淺模式">
          ${state.isDark ? icons.sun : icons.moon}
        </button>
      </div>
      <div class="toolbar__row">
        ${renderPlatformSelector(state)}
      </div>
      ${renderTemplateControls(state)}
    </div>
  `
}

// ─── 3. renderViewModeSwitcher ─────────────────────────

export function renderViewModeSwitcher(state) {
  const quickActive = state.viewMode === 'quick' ? 'view-switcher__btn--active' : ''
  const editorActive = state.viewMode === 'editor' ? 'view-switcher__btn--active' : ''

  return `
    <div class="view-switcher">
      <button class="view-switcher__btn ${quickActive}" data-action="set-view" data-view="quick">
        ${icons.zap} 快速模式
      </button>
      <button class="view-switcher__btn ${editorActive}" data-action="set-view" data-view="editor">
        ${icons.edit} 編輯器
      </button>
    </div>
  `
}

// ─── 4. renderPlatformSelector ─────────────────────────

export function renderPlatformSelector(state) {
  const platformEntries = Object.values(PLATFORMS)

  return `
    <div class="platform-pills">
      ${platformEntries.map(p => {
        const active = state.platform === p.id ? 'platform-pills__btn--active' : ''
        const icon = icons[p.id] || ''
        return `
          <button class="platform-pills__btn ${active}" data-action="set-platform" data-platform="${p.id}">
            ${icon} ${p.name}
          </button>
        `
      }).join('')}
    </div>
  `
}

// ─── 5. renderTemplateControls ─────────────────────────

export function renderTemplateControls(state) {
  const validation = validateTemplate(state.text, state.mode)
  const showTitleDetect = state.mode === 'theater' || state.mode === 'broetry'
  const showTheaterOptions = state.mode === 'theater'
  const showManualTitle = showTitleDetect && state.titleDetect === 'manual'

  return `
    <div class="template-controls">
      <div class="template-modes">
        ${TEMPLATE_MODES.map(m => {
          const active = state.mode === m.id ? 'template-modes__btn--active' : ''
          return `
            <button class="template-modes__btn ${active}" data-action="set-mode" data-mode="${m.id}" title="${m.description}">
              ${m.name}
            </button>
          `
        }).join('')}
      </div>

      ${showTitleDetect ? `
        <div class="template-options">
          <span class="template-options__label">標題偵測</span>
          <div class="title-detect-opts">
            ${TITLE_DETECT_OPTIONS.map(opt => {
              const active = state.titleDetect === opt.id ? 'title-detect-opts__btn--active' : ''
              return `
                <button class="title-detect-opts__btn ${active}" data-action="set-title-detect" data-detect="${opt.id}" title="${opt.desc}">
                  ${opt.label}
                </button>
              `
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${showManualTitle ? `
        <div class="template-options">
          <input
            type="text"
            class="manual-title-input"
            id="manual-title-input"
            placeholder="輸入標題..."
            maxlength="60"
            value="${escapeAttr(state.manualTitle || '')}"
          />
        </div>
      ` : ''}

      ${showTheaterOptions ? `
        <div class="template-options">
          <label class="template-options__label" for="title-style-select">標題樣式</label>
          <select class="manual-title-input" id="title-style-select" style="width: auto; max-width: 200px;">
            ${TITLE_STYLE_OPTIONS.map(opt => {
              const selected = state.titleStyle === opt.id ? 'selected' : ''
              return `<option value="${opt.id}" ${selected}>${opt.label}</option>`
            }).join('')}
          </select>
        </div>
        <div class="template-options">
          ${renderToggle('fullWidthPunctuation', '標點全形', state.fullWidthPunctuation)}
          ${renderToggle('sentenceCase', '句首大寫', state.sentenceCase)}
          ${renderToggle('fullWidthDigit', '數字全形', state.fullWidthDigit)}
        </div>
      ` : ''}

      ${validation.warnings.length > 0 ? `
        <div class="template-options">
          ${validation.warnings.map(w => `
            <span class="warning-badge">
              ${icons.alertTriangle} ${w}
            </span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `
}

// ─── 6. renderQuickMode ───────────────────────────────

export function renderQuickMode(state, data) {
  return `
    <div class="quick-mode">
      ${renderStatsBar(state)}
      <textarea
        id="post-textarea"
        class="post-textarea"
        placeholder="在這裡輸入或貼上你的貼文內容..."
      >${escapeHtml(state.text)}</textarea>
      ${renderSeparatorBar()}
      ${renderUnifiedPicker(state, data)}
      ${renderCopyButton(state)}
    </div>
  `
}

// ─── 7. renderEditorMode ──────────────────────────────

export function renderEditorMode(state, data) {
  return `
    <div class="editor-layout">
      ${renderEditorPane(state, data)}
      ${renderPreviewPane(state)}
    </div>
  `
}

// ─── 8. renderPreviewPane ─────────────────────────────

export function renderPreviewPane(state) {
  const platformTabActive = state.previewTab === 'platform' ? 'preview-tabs__btn--active' : ''
  const resultTabActive = state.previewTab === 'result' ? 'preview-tabs__btn--active' : ''

  const transformedText = applyTemplate(state.text, state.mode, {
    titleDetect: state.titleDetect,
    manualTitle: state.manualTitle,
    titleStyle: state.titleStyle,
    fullWidthPunctuation: state.fullWidthPunctuation,
    sentenceCase: state.sentenceCase,
    fullWidthDigit: state.fullWidthDigit,
  })

  return `
    <div class="preview-pane">
      <div class="preview-tabs">
        <button class="preview-tabs__btn ${platformTabActive}" data-action="set-preview-tab" data-tab="platform">
          ${icons.eye} 平台預覽
        </button>
        <button class="preview-tabs__btn ${resultTabActive}" data-action="set-preview-tab" data-tab="result">
          ${icons.text} 轉換結果
        </button>
      </div>

      ${state.previewTab === 'platform' ? `
        <div style="margin-bottom: 12px;">
          ${renderDeviceSwitcher(state)}
        </div>
      ` : ''}

      <div id="preview-content">
        ${state.previewTab === 'platform'
          ? renderPlatformPreview(state)
          : `<pre class="result-preview">${escapeHtml(transformedText)}</pre>`
        }
      </div>
    </div>
  `
}

// ─── 9. renderEditorPane ──────────────────────────────

export function renderEditorPane(state, data) {
  return `
    <div class="editor-pane">
      <div class="pane__header">
        <span class="pane__title">${icons.edit} 編輯</span>
        <button class="separator-bar__btn" data-action="paste-text">
          ${icons.paste} 貼上
        </button>
      </div>
      ${renderStatsBar(state)}
      <textarea
        id="post-textarea"
        class="post-textarea"
        placeholder="在這裡輸入或貼上你的貼文內容..."
      >${escapeHtml(state.text)}</textarea>
      ${renderSeparatorBar()}
      ${renderUnifiedPicker(state, data)}
      ${renderCopyButton(state)}
    </div>
  `
}

// ─── 10. renderStatsBar ───────────────────────────────

export function renderStatsBar(state) {
  const stats = computeStats(state.text, state.platform)
  if (!stats) return '<div id="stats-bar" class="stats-bar"></div>'

  const statusColor = getStatusColor(stats.status)
  const progressWidth = `${Math.min(stats.charPercent, 100)}%`

  return `
    <div id="stats-bar" class="stats-bar">
      <div class="stats-progress">
        <div
          class="stats-progress__fill"
          id="progress-fill"
          style="width: ${progressWidth}; background-color: ${statusColor};"
        ></div>
      </div>
      <div class="stats-label">
        <span class="stats-label__item">
          <span style="color: ${statusColor};">${stats.charCount}</span> / ${stats.maxChars}
        </span>
        <span class="stats-label__item">
          ${stats.lineCount} 行 / ${stats.paragraphCount} 段
        </span>
        ${renderPlatformBadges(state.platform, stats)}
      </div>
    </div>
  `
}

// ─── 11. renderUnifiedPicker ──────────────────────────

export function renderUnifiedPicker(state, data) {
  const pickerTab = state.pickerTab || 'emoji'
  const pickerCategory = state.pickerCategory || ''

  const topTabs = [
    { id: 'emoji', label: 'Emoji', icon: icons.smile },
    { id: 'symbols', label: '表情符號', icon: icons.grid },
    { id: 'kaomoji', label: '顏文字', icon: icons.type },
  ]

  const currentData = data[pickerTab]
  const categories = currentData?.categories || []
  const activeCategory = pickerCategory || (categories[0]?.id || '')
  const activeCategoryData = categories.find(c => c.id === activeCategory)
  const items = activeCategoryData?.items || []

  const isWide = pickerTab === 'kaomoji'

  return `
    <div class="picker" id="unified-picker">
      <div class="picker__top-tabs">
        ${topTabs.map(t => {
          const active = pickerTab === t.id ? 'picker__top-tab--active' : ''
          return `
            <button class="picker__top-tab ${active}" data-action="set-picker-tab" data-picker-tab="${t.id}">
              ${t.icon} ${t.label}
            </button>
          `
        }).join('')}
      </div>

      <div class="picker__sub-tabs">
        ${categories.map(cat => {
          const active = activeCategory === cat.id ? 'picker__sub-tab--active' : ''
          return `
            <button class="picker__sub-tab ${active}" data-action="set-picker-category" data-picker-category="${cat.id}">
              ${cat.label}
            </button>
          `
        }).join('')}
      </div>

      <div class="picker__content">
        <div class="picker__grid ${isWide ? 'picker__grid--wide' : ''}">
          ${items.map(item => {
            const escapedItem = escapeAttr(item)
            if (isWide) {
              return `
                <button class="picker__item picker__item--wide" data-action="insert-item" data-item="${escapedItem}">
                  ${escapeHtml(item)}
                </button>
              `
            }
            return `
              <button class="picker__item" data-action="insert-item" data-item="${escapedItem}">
                ${escapeHtml(item)}
              </button>
            `
          }).join('')}
        </div>
      </div>
    </div>
  `
}

// ─── 12. renderSeparatorBar ───────────────────────────

export function renderSeparatorBar() {
  return `
    <div class="separator-bar">
      ${SEPARATORS.map(sep => `
        <button class="separator-bar__btn" data-action="insert-separator" data-sep="${escapeAttr(sep)}" aria-label="插入分隔線 ${escapeAttr(sep)}">
          ${escapeHtml(sep)}
        </button>
      `).join('')}
    </div>
  `
}

// ─── 13. renderPlatformPreview ────────────────────────

export function renderPlatformPreview(state) {
  const deviceWidth = DEVICE_WIDTHS[state.previewDevice] || '100%'

  const transformedText = applyTemplate(state.text, state.mode, {
    titleDetect: state.titleDetect,
    manualTitle: state.manualTitle,
    titleStyle: state.titleStyle,
    fullWidthPunctuation: state.fullWidthPunctuation,
    sentenceCase: state.sentenceCase,
    fullWidthDigit: state.fullWidthDigit,
  })

  const previewHtml = toPreviewHtml(transformedText)
  const lines = transformedText.split('\n')

  switch (state.platform) {
    case 'facebook':
      return renderFacebookPreview(previewHtml, lines, deviceWidth, state)
    case 'instagram':
      return renderInstagramPreview(previewHtml, transformedText, deviceWidth, state)
    case 'threads':
      return renderThreadsPreview(previewHtml, deviceWidth)
    default:
      return '<div style="text-align:center;color:var(--text-muted);padding:24px;">請選擇平台</div>'
  }
}

function renderFacebookPreview(previewHtml, lines, deviceWidth, state) {
  const lineCount = lines.length
  const shouldFold = lineCount > 5 && !state.previewExpanded
  const visibleHtml = shouldFold
    ? toPreviewHtml(lines.slice(0, 5).join('\n'))
    : previewHtml

  return `
    <div class="fb-preview" style="max-width: ${deviceWidth}">
      <div class="post-card__header">
        <div class="post-card__avatar"></div>
        <div class="post-card__meta">
          <div class="post-card__username">Preview</div>
          <div class="post-card__timestamp">剛剛</div>
        </div>
      </div>
      <div class="post-card__content">${visibleHtml}</div>
      ${shouldFold ? `
        <button class="post-card__show-more" data-action="toggle-expand">顯示更多</button>
      ` : ''}
      <div class="post-card__actions">
        <span class="post-card__action">👍 讚</span>
        <span class="post-card__action">💬 留言</span>
        <span class="post-card__action">↗️ 分享</span>
      </div>
    </div>
  `
}

function renderInstagramPreview(previewHtml, transformedText, deviceWidth, state) {
  const maxCaptionLen = 125
  const shouldTruncate = transformedText.length > maxCaptionLen && !state.previewExpanded
  const visibleText = shouldTruncate
    ? transformedText.slice(0, maxCaptionLen)
    : transformedText
  const visibleHtml = toPreviewHtml(visibleText)

  return `
    <div class="ig-preview" style="max-width: ${deviceWidth}">
      <div class="post-card__header">
        <div class="post-card__avatar"></div>
        <div class="post-card__meta">
          <div class="post-card__username">preview</div>
        </div>
      </div>
      <div style="background:var(--bg-secondary);aspect-ratio:1;border-radius:8px;margin-bottom:12px;"></div>
      <div class="post-card__actions" style="border-top:none;padding-top:0;">
        <span class="post-card__action">♡</span>
        <span class="post-card__action">💬</span>
        <span class="post-card__action">↗</span>
      </div>
      <div class="post-card__content">
        <strong>preview</strong> ${visibleHtml}${shouldTruncate ? `<button class="post-card__show-more" data-action="toggle-expand">...更多</button>` : ''}
      </div>
    </div>
  `
}

function renderThreadsPreview(previewHtml, deviceWidth) {
  return `
    <div class="threads-preview" style="max-width: ${deviceWidth}">
      <div class="post-card__header">
        <div class="post-card__avatar"></div>
        <div class="post-card__meta">
          <div class="post-card__username">preview</div>
          <div class="post-card__timestamp">剛剛</div>
        </div>
      </div>
      <div class="post-card__content">${previewHtml}</div>
    </div>
  `
}

// ─── Device Switcher ──────────────────────────────────

function renderDeviceSwitcher(state) {
  const devices = [
    { id: 'ios', label: 'iOS', icon: icons.smartphone },
    { id: 'android', label: 'Android', icon: icons.smartphone },
    { id: 'desktop', label: 'Desktop', icon: icons.monitor },
  ]

  return `
    <div class="device-switcher">
      ${devices.map(d => {
        const active = state.previewDevice === d.id ? 'device-switcher__btn--active' : ''
        return `
          <button class="device-switcher__btn ${active}" data-action="set-device" data-device="${d.id}">
            ${d.icon} ${d.label}
          </button>
        `
      }).join('')}
    </div>
  `
}

// ─── 14. renderCopyButton ─────────────────────────────

export function renderCopyButton(state) {
  const successClass = state.copyState === 'success' ? 'copy-btn--success' : ''
  const label = state.copyState === 'success'
    ? `${icons.check} 已複製`
    : `${icons.copy} 複製並套用格式`

  return `
    <button class="copy-btn ${successClass}" data-action="copy-result">
      ${label}
    </button>
  `
}

// ─── 15. updatePicker ────────────────────────────────

export function updatePicker(state, data) {
  const el = document.getElementById('unified-picker')
  if (!el) return
  const html = renderUnifiedPicker(state, data)
  // 取出 picker 內部內容（去掉外層 div）
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const inner = tmp.firstElementChild
  if (inner) {
    el.innerHTML = inner.innerHTML
  }
}

// ─── 16. 局部更新函式 ─────────────────────────────────

export function updateStatsBar(state) {
  const el = document.getElementById('stats-bar')
  if (!el) return
  const stats = computeStats(state.text, state.platform)
  if (!stats) return

  const statusColor = getStatusColor(stats.status)
  const progressWidth = `${Math.min(stats.charPercent, 100)}%`

  el.innerHTML = `
    <div class="stats-progress">
      <div
        class="stats-progress__fill"
        id="progress-fill"
        style="width: ${progressWidth}; background-color: ${statusColor};"
      ></div>
    </div>
    <div class="stats-label">
      <span class="stats-label__item">
        <span style="color: ${statusColor};">${stats.charCount}</span> / ${stats.maxChars}
      </span>
      <span class="stats-label__item">
        ${stats.lineCount} 行 / ${stats.paragraphCount} 段
      </span>
      ${renderPlatformBadges(state.platform, stats)}
    </div>
  `
}

export function updatePreviewContent(state) {
  const el = document.getElementById('preview-content')
  if (!el) return

  const transformedText = applyTemplate(state.text, state.mode, {
    titleDetect: state.titleDetect,
    manualTitle: state.manualTitle,
    titleStyle: state.titleStyle,
    fullWidthPunctuation: state.fullWidthPunctuation,
    sentenceCase: state.sentenceCase,
    fullWidthDigit: state.fullWidthDigit,
  })

  if (state.previewTab === 'platform') {
    el.innerHTML = renderPlatformPreview(state)
  } else {
    el.innerHTML = `<pre class="result-preview">${escapeHtml(transformedText)}</pre>`
  }
}

export function updateProgressBar(state) {
  const el = document.getElementById('progress-fill')
  if (!el) return
  const stats = computeStats(state.text, state.platform)
  if (!stats) return

  const statusColor = getStatusColor(stats.status)
  el.style.width = `${Math.min(stats.charPercent, 100)}%`
  el.style.backgroundColor = statusColor
}

// ─── 輔助函式 ─────────────────────────────────────────

function renderPlatformBadges(platformId, stats) {
  const badges = []

  if (platformId === 'facebook' && stats.showMoreTriggered) {
    badges.push(`
      <span class="stats-badge stats-badge--warning">
        ${icons.alertTriangle} 超過 5 行將折疊
      </span>
    `)
  }

  if (platformId === 'instagram') {
    const overClass = stats.hashtagOver ? 'stats-badge--danger' : 'stats-badge--info'
    badges.push(`
      <span class="stats-badge ${overClass}">
        #${stats.hashtagCount}/${stats.hashtagLimit}
      </span>
    `)
  }

  if (platformId === 'threads' && stats.threadSplits) {
    badges.push(`
      <span class="stats-badge stats-badge--warning">
        ${icons.alertTriangle} 建議拆為 ${stats.threadSplits.length} 則串文
      </span>
    `)
  }

  if (platformId === 'threads' && stats.zwspOverflow) {
    badges.push(`
      <span class="stats-badge stats-badge--warning">
        ${icons.alertTriangle} 換行符可能導致超過 500 字
      </span>
    `)
  }

  return badges.join('')
}

function renderToggle(key, label, checked) {
  const checkedAttr = checked ? 'checked' : ''
  return `
    <label class="toggle-switch">
      <input
        type="checkbox"
        data-action="toggle-option"
        data-option="${key}"
        ${checkedAttr}
      />
      <span class="toggle-switch__track">
        <span class="toggle-switch__knob"></span>
      </span>
      ${label}
    </label>
  `
}

function getStatusColor(status) {
  switch (status) {
    case 'green': return '#A8B5A0'
    case 'yellow': return '#D4A520'
    case 'red': return '#E85555'
    default: return '#A8B5A0'
  }
}

function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeAttr(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
