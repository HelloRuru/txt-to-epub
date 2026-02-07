/**
 * prompt-engine.js - 提詞組合邏輯
 */

// 分類排序權重（越小越前面）
const CATEGORY_ORDER = {
  quality: 0,
  composition: 1,
  character: 2,
  clothing: 3,
  expression: 4,
  pose: 5,
  background: 6,
  lighting: 7,
  style: 8,
  color: 9
};

/**
 * 格式化帶權重的標籤
 */
export function formatTag(tag, weight = 1.0) {
  if (!weight || weight === 1.0) return tag;
  return `(${tag}:${weight})`;
}

/**
 * 組合正向提詞
 */
export function composePositive(selectedTags, customTags = []) {
  // 按分類排序收集所有標籤
  const ordered = [];

  const sortedCategories = Object.keys(selectedTags).sort(
    (a, b) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99)
  );

  for (const catId of sortedCategories) {
    const tags = selectedTags[catId];
    if (!tags || tags.length === 0) continue;
    for (const t of tags) {
      ordered.push(formatTag(t.tag, t.weight));
    }
  }

  // 附加自訂標籤
  const custom = customTags
    .map(t => t.trim())
    .filter(t => t.length > 0);

  return [...ordered, ...custom].join(', ');
}

/**
 * 組合反向提詞
 */
export function composeNegative(negativesData, presetKey, additionalGroups = []) {
  const preset = negativesData.presets[presetKey];
  if (!preset) return '';

  const tags = new Set(preset.tags);

  // 加入額外補充組
  for (const groupKey of additionalGroups) {
    const group = negativesData.additional[groupKey];
    if (group) {
      for (const tag of group.tags) {
        tags.add(tag);
      }
    }
  }

  return [...tags].join(', ');
}

/**
 * 格式化生成設定為文字
 */
export function formatSettings(settings) {
  if (!settings) return '';
  const parts = [];
  if (settings.steps) parts.push(`Steps: ${settings.steps}`);
  if (settings.cfgScale) parts.push(`CFG: ${settings.cfgScale}`);
  if (settings.sampler) parts.push(`Sampler: ${settings.sampler}`);
  if (settings.resolution) parts.push(`Size: ${settings.resolution}`);
  if (settings.clipSkip) parts.push(`Clip Skip: ${settings.clipSkip}`);
  return parts.join(', ');
}

/**
 * 組合所有內容為完整文字塊
 */
export function composeAll(positive, negative, settings) {
  let result = positive;
  if (negative) {
    result += '\n\nNegative prompt: ' + negative;
  }
  if (settings) {
    result += '\n\n' + formatSettings(settings);
  }
  return result;
}
