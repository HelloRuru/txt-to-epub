/**
 * render-panel.js — Side Panel 專用 UI 渲染
 *
 * 改寫自原版 render.js：
 * - 單欄垂直佈局（適配 ~360px Side Panel）
 * - 移除 Hero / Footer / Editor-Quick 雙模式 / Device Switcher
 * - 新增可摺疊預覽區
 * - 新增自動偵測 badge
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

// ─── 1. renderApp ─────────────────────────────────────

export function renderApp(state, data) {
  const hidden = state.hiddenSections || []
  return `
    ${renderToolbar(state)}
    ${renderTemplateControls(state)}
    ${renderEditorArea(state, hidden, data)}
    ${!hidden.includes('preview') ? renderCollapsiblePreview(state) : ''}
    ${renderCopyButton(state)}
  `
}

// ─── 2. renderToolbar ─────────────────────────────────

function renderToolbar(state) {
  const hiddenPlatforms = state.hiddenPlatforms || []
  const visiblePlatforms = Object.values(PLATFORMS).filter(p => !hiddenPlatforms.includes(p.id))

  return `
    <div class="toolbar">
      <div class="toolbar__row">
        <span class="toolbar__title">${icons.edit} Post Writer</span>
        <div class="toolbar__right">
          ${visiblePlatforms.map(p => {
            const active = state.platform === p.id ? 'platform-pills__btn--active' : ''
            const icon = icons[p.id] || ''
            const isAutoDetected = state.autoDetectedPlatform === p.id && state.platform === p.id
            return `
              <button class="platform-pills__btn ${active}" data-action="set-platform" data-platform="${p.id}" title="${p.name}">
                ${icon}
                ${isAutoDetected ? '<span class="auto-badge">auto</span>' : ''}
              </button>
            `
          }).join('')}
          <button class="toolbar__icon-btn" data-action="toggle-platform-settings" aria-label="平台設定">
            ${icons.settings}
          </button>
          <button class="toolbar__icon-btn" data-action="toggle-theme" aria-label="切換深淺模式">
            ${state.isDark ? icons.sun : icons.moon}
          </button>
        </div>
      </div>
      ${state.showPlatformSettings ? renderPlatformSettings(state) : ''}
    </div>
  `
}

// ─── 3. renderPlatformSettings ──────────────────────────

function renderPlatformSettings(state) {
  const hiddenPlatforms = state.hiddenPlatforms || []
  const hiddenModes = state.hiddenModes || []
  const hiddenSections = state.hiddenSections || []
  const allPlatforms = Object.values(PLATFORMS)

  const sections = [
    { id: 'separator', label: '分隔線' },
    { id: 'emoji', label: 'Emoji' },
    { id: 'symbols', label: '符號' },
    { id: 'kaomoji', label: '顏文字' },
    { id: 'preview', label: '預覽' },
  ]

  return `
    <div class="platform-settings">
      <div class="platform-settings__title">平台</div>
      ${allPlatforms.map(p => {
        const visible = !hiddenPlatforms.includes(p.id)
        const icon = icons[p.id] || ''
        return `
          <label class="platform-settings__item">
            <input type="checkbox" ${visible ? 'checked' : ''}
              data-action="toggle-platform-visibility" data-platform="${p.id}" />
            <span>${icon} ${p.name}</span>
          </label>
        `
      }).join('')}

      <div class="platform-settings__title" style="margin-top:8px;">格式</div>
      ${TEMPLATE_MODES.map(m => {
        const visible = !hiddenModes.includes(m.id)
        return `
          <label class="platform-settings__item">
            <input type="checkbox" ${visible ? 'checked' : ''}
              data-action="toggle-mode-visibility" data-mode="${m.id}" />
            <span>${m.name}</span>
          </label>
        `
      }).join('')}

      <div class="platform-settings__title" style="margin-top:8px;">區塊</div>
      ${sections.map(s => {
        const visible = !hiddenSections.includes(s.id)
        return `
          <label class="platform-settings__item">
            <input type="checkbox" ${visible ? 'checked' : ''}
              data-action="toggle-section-visibility" data-section="${s.id}" />
            <span>${s.label}</span>
          </label>
        `
      }).join('')}

      <div class="platform-settings__title" style="margin-top:8px;">外觀</div>
      <label class="platform-settings__item">
        <input type="checkbox" ${state.isDark ? 'checked' : ''}
          data-action="toggle-theme" />
        <span>${icons.moon} 深色模式</span>
      </label>
    </div>
  `
}

// ─── 4. renderTemplateControls ─────────────────────────

function renderTemplateControls(state) {
  const validation = validateTemplate(state.text, state.mode)
  const hiddenModes = state.hiddenModes || []
  const visibleModes = TEMPLATE_MODES.filter(m => !hiddenModes.includes(m.id))
  const showTitleDetect = state.mode === 'theater' || state.mode === 'broetry'
  const showTheaterOptions = state.mode === 'theater'
  const showManualTitle = showTitleDetect && state.titleDetect === 'manual'

  return `
    <div class="template-controls">
      ${visibleModes.length > 0 ? `
        <div class="template-modes">
          ${visibleModes.map(m => {
            const active = state.mode === m.id ? 'template-modes__btn--active' : ''
            return '<button class="template-modes__btn ' + active + '" data-action="set-mode" data-mode="' + m.id + '" title="' + (m.description || '') + '">' + m.name + '</button>'
          }).join('')}
        </div>
      ` : ''}

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
          <select class="manual-title-input" id="title-style-select" style="width: auto; max-width: 180px;">
            ${TITLE_STYLE_OPTIONS.map(opt => {
              const selected = state.titleStyle === opt.id ? 'selected' : ''
              return `<option value="${opt.id}" ${selected}>${opt.label}</option>`
            }).join('')}
          </select>
        </div>
        <div class="template-options template-options--toggles">
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

// ─── 5. renderEditorArea ────────────────────────────

function renderEditorArea(state, hidden, data) {
  const showSeparator = !hidden.includes('separator')
  const allPickerHidden = ['emoji', 'symbols', 'kaomoji'].every(t => hidden.includes(t))

  return `
    <div class="editor-section">
      <div class="pane__header">
        <div style="display:flex;gap:6px;">
          <button class="separator-bar__btn" data-action="paste-text" aria-label="貼上">
            ${icons.paste} 貼上
          </button>
          <button class="separator-bar__btn" data-action="clear-text" aria-label="清空">
            ${icons.trash} 清空
          </button>
        </div>
      </div>
      <textarea
        id="post-textarea"
        class="post-textarea"
        aria-label="貼文內容"
        placeholder="在這裡輸入或貼上你的貼文內容..."
      >${escapeHtml(state.text)}</textarea>
      ${renderStatsBar(state)}
      ${showSeparator ? renderSeparatorBar() : ''}
      ${!allPickerHidden ? renderUnifiedPicker(state, data) : ''}
    </div>
  `
}

// ─── 6. renderStatsBar ───────────────────────────────

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

// ─── 7. renderUnifiedPicker ──────────────────────────

function renderUnifiedPicker(state, data) {
  const hidden = state.hiddenSections || []

  const allTabs = [
    { id: 'emoji', label: 'Emoji', icon: icons.smile },
    { id: 'symbols', label: '符號', icon: icons.grid },
    { id: 'kaomoji', label: '顏文字', icon: icons.type },
  ]

  const topTabs = allTabs.filter(t => !hidden.includes(t.id))
  if (topTabs.length === 0) return ''

  // 如果目前 tab 被隱藏，自動切到第一個可見的
  let pickerTab = state.pickerTab || 'emoji'
  if (!topTabs.some(t => t.id === pickerTab)) {
    pickerTab = topTabs[0].id
  }

  const pickerCategory = state.pickerCategory || ''

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

// ─── 8. renderSeparatorBar ───────────────────────────

function renderSeparatorBar() {
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

// ─── 9. renderCollapsiblePreview ─────────────────────

function renderCollapsiblePreview(state) {
  const platformTabActive = state.previewTab === 'platform' ? 'preview-tabs__btn--active' : ''
  const resultTabActive = state.previewTab === 'result' ? 'preview-tabs__btn--active' : ''
  const chevron = state.previewOpen ? icons.chevronUp : icons.chevronDown

  const transformedText = applyTemplate(state.text, state.mode, {
    titleDetect: state.titleDetect,
    manualTitle: state.manualTitle,
    titleStyle: state.titleStyle,
    fullWidthPunctuation: state.fullWidthPunctuation,
    sentenceCase: state.sentenceCase,
    fullWidthDigit: state.fullWidthDigit,
  })

  return `
    <div class="preview-collapsible">
      <button class="preview-collapsible__header" data-action="toggle-preview">
        <span>${icons.eye} 預覽</span>
        <span class="preview-collapsible__chevron">${chevron}</span>
      </button>
      ${state.previewOpen ? `
        <div class="preview-collapsible__body">
          <div class="preview-tabs">
            <button class="preview-tabs__btn ${platformTabActive}" data-action="set-preview-tab" data-tab="platform">
              平台預覽
            </button>
            <button class="preview-tabs__btn ${resultTabActive}" data-action="set-preview-tab" data-tab="result">
              轉換結果
            </button>
          </div>
          <div id="preview-content" class="preview-content">
            ${state.previewTab === 'platform'
              ? renderPlatformPreview(state)
              : `<pre class="result-preview">${escapeHtml(transformedText)}</pre>`
            }
          </div>
        </div>
      ` : ''}
    </div>
  `
}

// ─── 10. renderPlatformPreview ────────────────────────

function renderPlatformPreview(state) {
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
      return renderFacebookPreview(previewHtml, lines, state)
    case 'instagram':
      return renderInstagramPreview(previewHtml, transformedText, state)
    case 'threads':
      return renderThreadsPreview(previewHtml)
    default:
      return '<div style="text-align:center;color:var(--text-muted);padding:16px;">請選擇平台</div>'
  }
}

function renderFacebookPreview(previewHtml, lines, state) {
  const lineCount = lines.length
  const shouldFold = lineCount > 5 && !state.previewExpanded
  const visibleHtml = shouldFold
    ? toPreviewHtml(lines.slice(0, 5).join('\n'))
    : previewHtml

  return `
    <div class="fb-preview">
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
        <span class="post-card__action">${icons.thumbsUp} 讚</span>
        <span class="post-card__action">${icons.messageCircle} 留言</span>
        <span class="post-card__action">${icons.share} 分享</span>
      </div>
    </div>
  `
}

function renderInstagramPreview(previewHtml, transformedText, state) {
  const maxCaptionLen = 125
  const shouldTruncate = transformedText.length > maxCaptionLen && !state.previewExpanded
  const visibleText = shouldTruncate
    ? transformedText.slice(0, maxCaptionLen)
    : transformedText
  const visibleHtml = toPreviewHtml(visibleText)

  return `
    <div class="ig-preview">
      <div class="post-card__header">
        <div class="post-card__avatar"></div>
        <div class="post-card__meta">
          <div class="post-card__username">preview</div>
        </div>
      </div>
      <div style="background:var(--bg-secondary);aspect-ratio:1;border-radius:8px;margin-bottom:12px;"></div>
      <div class="post-card__actions" style="border-top:none;padding-top:0;">
        <span class="post-card__action">${icons.heart}</span>
        <span class="post-card__action">${icons.messageCircle}</span>
        <span class="post-card__action">${icons.share}</span>
      </div>
      <div class="post-card__content">
        <strong>preview</strong> ${visibleHtml}${shouldTruncate ? `<button class="post-card__show-more" data-action="toggle-expand">...更多</button>` : ''}
      </div>
    </div>
  `
}

function renderThreadsPreview(previewHtml) {
  return `
    <div class="threads-preview">
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

// ─── 11. renderCopyButton ─────────────────────────────

function renderCopyButton(state) {
  const successClass = state.copyState === 'success' ? 'copy-btn--success' : ''
  const label = state.copyState === 'success'
    ? `${icons.check} 已複製`
    : `${icons.copy} 複製並套用格式`

  return `
    <div class="copy-btn-wrapper">
      <button class="copy-btn ${successClass}" data-action="copy-result">
        ${label}
      </button>
    </div>
  `
}

// ─── 12. updatePicker ────────────────────────────────

export function updatePicker(state, data) {
  const el = document.getElementById('unified-picker')
  if (!el) return
  const html = renderUnifiedPicker(state, data)
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const inner = tmp.firstElementChild
  if (inner) {
    el.innerHTML = inner.innerHTML
  }
}

// ─── 13. 局部更新函式 ─────────────────────────────────

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
