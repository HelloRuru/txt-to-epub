// 即時預覽功能
import { defaultPalette } from '../data/palettes.js';

let currentPalette = null;

export function applyPalette(palette) {
  currentPalette = palette;

  // 更新 CSS 變數
  const root = document.documentElement;
  root.style.setProperty('--color-bg', palette.colors.background);
  root.style.setProperty('--color-heading', palette.colors.heading);
  root.style.setProperty('--color-text', palette.colors.text);
  root.style.setProperty('--color-button', palette.colors.button);
  root.style.setProperty('--color-accent', palette.colors.accent);

  // 顯示預覽區域（不捲動，配色變化本身就足夠明顯）
  const previewSection = document.getElementById('preview-section');
  if (previewSection) {
    previewSection.style.display = 'block';
  }

  // Toast 提示
  showToast(`已套用「${palette.name}」配色`);
}

export function resetPalette() {
  currentPalette = null;

  // 重置為預設配色
  const root = document.documentElement;
  root.style.setProperty('--color-bg', defaultPalette.colors.background);
  root.style.setProperty('--color-heading', defaultPalette.colors.heading);
  root.style.setProperty('--color-text', defaultPalette.colors.text);
  root.style.setProperty('--color-button', defaultPalette.colors.button);
  root.style.setProperty('--color-accent', defaultPalette.colors.accent);

  // 隱藏預覽區域
  const previewSection = document.getElementById('preview-section');
  if (previewSection) {
    previewSection.style.display = 'none';
  }

  // 捲動回頂部
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Toast 提示
  showToast('已返回原配色');
}

// Toast 通知（共用函數）
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}
