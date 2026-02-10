// 渲染色塊選擇器 + 單一配色卡片
import { paletteGroups } from '../data/palettes.js';
import { copyColor } from '../features/copy.js';
import { applyPalette } from '../features/preview.js';

let currentPaletteIndex = 0; // 當前選中的配色組索引

export function renderPalettes() {
  renderPaletteCard(currentPaletteIndex);
  bindRegionSelector();
}

// 綁定地區下拉選單
function bindRegionSelector() {
  const select = document.getElementById('region-select');
  if (!select) return;

  select.value = currentPaletteIndex.toString();

  select.addEventListener('change', (e) => {
    const index = parseInt(e.target.value);
    switchPalette(index);
  });
}

// 切換配色組
function switchPalette(index) {
  currentPaletteIndex = index;

  // 重新渲染配色卡片
  renderPaletteCard(index);

  // 立即套用配色到整個網站
  const card = document.querySelector('.palette-card');
  if (card) {
    const currentMode = card.dataset.currentMode || 'light';
    const palette = paletteGroups[index][currentMode];
    if (palette) {
      applyPalette(palette);
    }
  }
}

// 渲染單一配色卡片
function renderPaletteCard(groupIndex) {
  const paletteDisplay = document.getElementById('palette-display');
  if (!paletteDisplay) return;

  const group = paletteGroups[groupIndex];
  const defaultMode = 'light';
  const currentPalette = group[defaultMode];
  const colorEntries = Object.entries(currentPalette.colors);

  paletteDisplay.innerHTML = `
    <div class="palette-card" data-group-index="${groupIndex}" data-current-mode="${defaultMode}">
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

      <div class="color-swatches-planets">
        ${colorEntries.map(([key, hex], index) => {
          // 行星大小配置（依用途重要性）
          const planetSizes = {
            background: 100,  // 背景色 - 最大（土星大小）
            heading: 80,      // 標題色 - 大（木星大小）
            text: 60,         // 內文色 - 中（地球大小）
            button: 70,       // 按鈕色 - 中大（天王星大小）
            accent: 50        // 提示色 - 小（火星大小）
          };

          // 垂直偏移（錯落排列）
          const planetOffsets = {
            background: -10,
            heading: 15,
            text: -5,
            button: 20,
            accent: 0
          };

          const size = planetSizes[key] || 60;
          const offset = planetOffsets[key] || 0;

          return `
          <div class="color-planet" data-color="${hex}" data-usage="${currentPalette.usage[key]}" data-planet-key="${key}" style="--planet-size: ${size}px; --planet-offset: ${offset}px;">
            <div class="planet-orb" style="background-color: ${hex};"></div>
            <div class="planet-info">
              <div class="planet-usage">${currentPalette.usage[key]}</div>
              <div class="planet-hex">${hex}</div>
            </div>
          </div>
        `}).join('')}
      </div>

    </div>
  `;

  // 綁定事件
  bindCardEvents(paletteDisplay);
}

// 綁定配色卡片事件
function bindCardEvents(container) {
  const card = container.querySelector('.palette-card');
  if (!card) return;

  const groupIndex = parseInt(card.dataset.groupIndex);

  // 綁定模式切換按鈕
  container.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const targetMode = e.target.closest('.mode-btn').dataset.mode;
      switchMode(card, groupIndex, targetMode);
    });
  });

  // 綁定色塊點擊事件（複製 HEX）
  container.querySelectorAll('.color-planet').forEach(planet => {
    planet.addEventListener('click', () => {
      const hex = planet.dataset.color;
      const usage = planet.dataset.usage;
      copyColor(hex, usage);
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

  // 更新行星色塊
  const planets = card.querySelectorAll('.color-planet');
  colorEntries.forEach(([key, hex], index) => {
    if (planets[index]) {
      planets[index].dataset.color = hex;
      planets[index].dataset.usage = palette.usage[key];

      const orb = planets[index].querySelector('.planet-orb');
      orb.style.backgroundColor = hex;

      const usage = planets[index].querySelector('.planet-usage');
      usage.textContent = palette.usage[key];

      const hexText = planets[index].querySelector('.planet-hex');
      hexText.textContent = hex;
    }
  });

  // 更新預覽區的顏色
  const preview = card.querySelector('.color-preview');
  const previewHeading = card.querySelector('.preview-heading');
  const previewIntro = card.querySelector('.preview-intro');
  const previewLabel = card.querySelector('.preview-label');
  const previewText = card.querySelector('.preview-text');
  const previewAccent = card.querySelector('.preview-accent');
  const primaryBtn = card.querySelector('.preview-btn.primary');
  const secondaryBtn = card.querySelector('.preview-btn.secondary');

  if (preview) preview.style.backgroundColor = palette.colors.background;
  if (previewHeading) previewHeading.style.color = palette.colors.heading;
  if (previewIntro) previewIntro.style.color = palette.colors.text;
  if (previewLabel) previewLabel.style.color = palette.colors.text;
  if (previewText) previewText.style.color = palette.colors.text;
  if (previewAccent) previewAccent.style.color = palette.colors.accent;
  if (primaryBtn) primaryBtn.style.backgroundColor = palette.colors.button;
  if (secondaryBtn) secondaryBtn.style.backgroundColor = palette.colors.accent;

  // 立即套用配色到整個網站
  applyPalette(palette);
}
