// 渲染色組卡片
import { paletteGroups } from '../data/palettes.js';
import { copyColor } from '../features/copy.js';
import { applyPalette } from '../features/preview.js';

export function renderPalettes() {
  const container = document.getElementById('palettes-container');
  if (!container) return;

  container.innerHTML = paletteGroups.map((group, index) => {
    const defaultMode = 'light';
    const currentPalette = group[defaultMode];
    const colorEntries = Object.entries(currentPalette.colors);

    return `
      <div class="palette-card" data-group-index="${index}" data-current-mode="${defaultMode}">
        <div class="palette-header">
          <h3 class="palette-name">${group.nameCn} — ${group.name}</h3>
          <p class="palette-description">${currentPalette.description}</p>
        </div>

        <!-- Light/Dark Toggle -->
        <div class="mode-toggle">
          <button class="mode-btn active" data-mode="light" aria-label="Light mode">
            <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            Light
          </button>
          <button class="mode-btn" data-mode="dark" aria-label="Dark mode">
            <svg class="moon-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            Dark
          </button>
        </div>

        <div class="color-swatches">
          ${colorEntries.map(([key, hex]) => `
            <div class="color-swatch" data-color="${hex}" data-usage="${currentPalette.usage[key]}">
              <div class="color-preview" style="background-color: ${hex};">
                <div class="icon-demo">
                  <!-- 大圓形（實心）-->
                  <svg class="icon-circle" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="rgba(0, 0, 0, 0.15)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1"/>
                  </svg>
                  <!-- 按鈕示意（圓角矩形）-->
                  <svg class="icon-button" viewBox="0 0 48 20">
                    <rect x="2" y="2" width="44" height="16" rx="8" fill="rgba(0, 0, 0, 0.15)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1"/>
                  </svg>
                </div>
              </div>
              <div class="color-info">
                <div class="color-usage">${currentPalette.usage[key]}</div>
                <div class="color-hex">${hex}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 文字示範區 -->
        <div class="text-demo">
          <p class="demo-line-1" style="color: ${currentPalette.colors.text};">
            嗨，我是嚕嚕。Have a nice day!
          </p>
          <p class="demo-line-2" style="color: ${currentPalette.colors.text};">
            我是<span style="color: ${currentPalette.colors.accent};">想強調自己是嚕嚕</span>的Ruru！
          </p>
        </div>

        <div class="palette-actions">
          <button class="apply-button" data-group-index="${index}">
            套用預覽
          </button>
        </div>
      </div>
    `;
  }).join('');

  // 綁定模式切換按鈕
  container.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const card = e.target.closest('.palette-card');
      const groupIndex = parseInt(card.dataset.groupIndex);
      const targetMode = e.target.closest('.mode-btn').dataset.mode;

      switchMode(card, groupIndex, targetMode);
    });
  });

  // 綁定色塊點擊事件（複製 HEX）
  container.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const hex = swatch.dataset.color;
      const usage = swatch.dataset.usage;
      copyColor(hex, usage);
    });
  });

  // 綁定套用預覽按鈕
  container.querySelectorAll('.apply-button').forEach(button => {
    button.addEventListener('click', () => {
      const groupIndex = parseInt(button.dataset.groupIndex);
      const card = container.querySelector(`[data-group-index="${groupIndex}"]`);
      const currentMode = card.dataset.currentMode;
      const palette = paletteGroups[groupIndex][currentMode];

      if (palette) {
        applyPalette(palette);
      }
    });
  });
}

// 切換 Light/Dark 模式
function switchMode(card, groupIndex, targetMode) {
  const group = paletteGroups[groupIndex];
  const palette = group[targetMode];
  const colorEntries = Object.entries(palette.colors);

  // 更新當前模式
  card.dataset.currentMode = targetMode;

  // 更新按鈕狀態
  card.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === targetMode);
  });

  // 更新描述
  const description = card.querySelector('.palette-description');
  description.textContent = palette.description;

  // 更新色塊
  const swatches = card.querySelectorAll('.color-swatch');
  colorEntries.forEach(([key, hex], index) => {
    if (swatches[index]) {
      swatches[index].dataset.color = hex;
      swatches[index].dataset.usage = palette.usage[key];

      const preview = swatches[index].querySelector('.color-preview');
      preview.style.backgroundColor = hex;

      const usage = swatches[index].querySelector('.color-usage');
      usage.textContent = palette.usage[key];

      const hexText = swatches[index].querySelector('.color-hex');
      hexText.textContent = hex;
    }
  });

  // 更新文字示範區的顏色
  const demoLine1 = card.querySelector('.demo-line-1');
  const demoLine2 = card.querySelector('.demo-line-2');
  const demoAccent = card.querySelector('.demo-line-2 span');

  if (demoLine1) demoLine1.style.color = palette.colors.text;
  if (demoLine2) demoLine2.style.color = palette.colors.text;
  if (demoAccent) demoAccent.style.color = palette.colors.accent;
}
