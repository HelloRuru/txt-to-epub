/**
 * render.js - UI 渲染
 */

import { icons } from './icons.js';
import { formatTag, formatSettings } from './prompt-engine.js';

/**
 * 渲染模型選擇器
 */
export function renderModelSelector(models, selectedId) {
  return `
    <div class="model-selector">
      <h2 class="section-title">${icons.wand} 選擇模型</h2>
      <div class="model-grid">
        ${models.map(m => `
          <button class="model-card ${m.id === selectedId ? 'model-card--selected' : ''}"
                  data-action="select-model" data-model-id="${m.id}">
            <div class="model-card__header">
              <span class="model-card__name">${m.shortName}</span>
              <span class="badge badge--${m.architecture.toLowerCase()}">${m.architecture}</span>
            </div>
            <p class="model-card__desc">${m.description}</p>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * 渲染標籤分類（手風琴）
 */
export function renderTagCategories(categories, selectedTags, qualityPreset) {
  return categories.map(cat => {
    const isOpen = selectedTags[cat.id] && selectedTags[cat.id].length > 0;
    let tagsHtml = '';

    if (cat.id === 'quality' && cat.presets) {
      // 品質標籤依模型切換
      const presetTags = cat.presets[qualityPreset] || [];
      tagsHtml = renderTagChips(presetTags, cat.id, selectedTags[cat.id] || []);
    } else if (cat.subcategories) {
      // 含子分類（角色特徵）
      tagsHtml = cat.subcategories.map(sub => `
        <div class="subcategory">
          <div class="subcategory__label">${sub.name}</div>
          <div class="tag-chips">
            ${renderTagChips(sub.tags, cat.id, selectedTags[cat.id] || [])}
          </div>
        </div>
      `).join('');
    } else {
      tagsHtml = `<div class="tag-chips">${renderTagChips(cat.tags, cat.id, selectedTags[cat.id] || [])}</div>`;
    }

    const iconHtml = icons[cat.icon] || '';
    const count = (selectedTags[cat.id] || []).length;
    const countBadge = count > 0 ? `<span class="count-badge">${count}</span>` : '';

    return `
      <div class="category ${isOpen ? 'category--open' : ''}">
        <button class="category__header" data-action="toggle-category" data-cat-id="${cat.id}">
          <span class="category__icon">${iconHtml}</span>
          <span class="category__name">${cat.name}</span>
          ${countBadge}
          <span class="category__chevron">${icons.chevronDown}</span>
        </button>
        <div class="category__body">
          ${cat.id === 'quality' ? '' : ''}
          ${tagsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function renderTagChips(tags, categoryId, selected) {
  return tags.map(t => {
    const sel = selected.find(s => s.tag === t.tag);
    const isSelected = !!sel;
    const weight = sel ? sel.weight : 1.0;
    const weightLabel = weight > 1.0 ? `<span class="chip__weight">${weight}</span>` : '';

    return `
      <button class="chip ${isSelected ? 'chip--selected' : ''}"
              data-action="toggle-tag" data-cat-id="${categoryId}" data-tag="${t.tag}"
              title="${t.tag}">
        <span class="chip__label">${t.label}</span>
        ${weightLabel}
      </button>
    `;
  }).join('');
}

/**
 * 渲染自訂標籤輸入
 */
export function renderCustomInput(customTags) {
  return `
    <div class="custom-input-section">
      <h3 class="section-subtitle">自訂標籤</h3>
      <div class="custom-input-wrap">
        <input type="text" id="custom-tag-input" class="custom-input"
               placeholder="輸入自訂標籤，按 Enter 加入"
               autocomplete="off">
      </div>
      ${customTags.length > 0 ? `
        <div class="tag-chips" style="margin-top: 8px;">
          ${customTags.map((t, i) => `
            <button class="chip chip--selected chip--custom"
                    data-action="remove-custom" data-index="${i}"
                    title="${t}">
              <span class="chip__label">${t}</span>
              <span class="chip__remove">&times;</span>
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 渲染提詞預覽區
 */
export function renderPreview(positive, negative, settings, model) {
  const settingsText = model ? formatSettings(model.recommendedSettings) : '';

  return `
    <div class="preview">
      <h2 class="section-title">${icons.sparkles} 提詞預覽</h2>

      <div class="preview__block">
        <div class="preview__header">
          <span class="preview__label">正向提詞</span>
          <button class="btn-icon" data-action="copy" data-target="positive" title="複製">
            ${icons.copy}
          </button>
        </div>
        <textarea class="preview__text" id="preview-positive" rows="6"
                  data-action="edit-positive">${positive}</textarea>
      </div>

      <div class="preview__block">
        <div class="preview__header">
          <span class="preview__label">反向提詞</span>
          <button class="btn-icon" data-action="copy" data-target="negative" title="複製">
            ${icons.copy}
          </button>
        </div>
        <textarea class="preview__text" id="preview-negative" rows="4"
                  data-action="edit-negative">${negative}</textarea>
      </div>

      ${model ? `
        <div class="preview__block">
          <div class="preview__header">
            <span class="preview__label">${icons.sliders} 推薦設定</span>
            <button class="btn-icon" data-action="copy" data-target="settings" title="複製">
              ${icons.copy}
            </button>
          </div>
          <div class="settings-grid">
            <div class="setting-item">
              <span class="setting-label">Steps</span>
              <span class="setting-value">${model.recommendedSettings.steps}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">CFG</span>
              <span class="setting-value">${model.recommendedSettings.cfgScale}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Sampler</span>
              <span class="setting-value">${model.recommendedSettings.sampler}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Size</span>
              <span class="setting-value">${model.recommendedSettings.resolution}</span>
            </div>
            ${model.recommendedSettings.clipSkip ? `
              <div class="setting-item">
                <span class="setting-label">Clip Skip</span>
                <span class="setting-value">${model.recommendedSettings.clipSkip}</span>
              </div>
            ` : ''}
          </div>
          ${model.tips ? `<p class="tips">${model.tips}</p>` : ''}
        </div>
      ` : ''}

      <div class="preview__actions">
        <button class="btn btn--primary" data-action="copy" data-target="all">
          ${icons.copy} 一鍵複製全部
        </button>
        <button class="btn btn--ghost" data-action="clear-all">
          ${icons.trash} 清除全部
        </button>
      </div>
    </div>
  `;
}

/**
 * 渲染反向提詞補充組
 */
export function renderNegativeOptions(additionalGroups, selectedGroups) {
  const entries = Object.entries(additionalGroups);
  return `
    <div class="negative-options">
      <h3 class="section-subtitle">反向提詞補充</h3>
      <div class="tag-chips">
        ${entries.map(([key, group]) => {
          const isSelected = selectedGroups.includes(key);
          return `
            <button class="chip ${isSelected ? 'chip--selected' : ''}"
                    data-action="toggle-negative-group" data-group-key="${key}">
              <span class="chip__label">${group.name}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * 渲染完整產生器頁面
 */
export function renderGenerator(state) {
  const { models, tags, negatives, selectedModel, selectedTags, customTags, additionalNegatives } = state;
  const model = models.find(m => m.id === selectedModel);
  const qualityPreset = model ? model.qualityPreset : 'illustrious';

  const leftPanel = `
    <div class="generator__left">
      ${renderModelSelector(models, selectedModel)}
      <div class="tag-categories">
        <h2 class="section-title">選擇標籤</h2>
        ${renderTagCategories(tags.categories, selectedTags, qualityPreset)}
      </div>
      ${renderCustomInput(customTags)}
      ${negatives ? renderNegativeOptions(negatives.additional, additionalNegatives) : ''}
    </div>
  `;

  const rightPanel = `
    <div class="generator__right" id="preview-panel">
      ${renderPreview(state.positiveText, state.negativeText, null, model)}
    </div>
  `;

  return `
    <div class="generator">
      ${leftPanel}
      ${rightPanel}
    </div>
  `;
}

/**
 * 只更新預覽區
 */
export function updatePreview(state) {
  const panel = document.getElementById('preview-panel');
  if (!panel) return;
  const model = state.models.find(m => m.id === state.selectedModel);
  panel.innerHTML = renderPreview(state.positiveText, state.negativeText, null, model);
}
