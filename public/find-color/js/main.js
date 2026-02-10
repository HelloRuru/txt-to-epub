// Find-Color 主入口
import { renderPalettes } from './core/render.js';
import { resetPalette } from './features/preview.js';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 渲染所有色組卡片
  renderPalettes();

  // 綁定返回原配色按鈕
  const resetButton = document.getElementById('reset-preview');
  if (resetButton) {
    resetButton.addEventListener('click', resetPalette);
  }

  console.log('Find-Color 已初始化 ✨');
});
