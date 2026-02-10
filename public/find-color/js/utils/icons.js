// SVG Icons 工具模組
// 目前使用 Emoji，未來可擴充為 SVG Icons

export const icons = {
  palette: '🎨',
  copy: '📋',
  eye: '👁️',
  check: '✓',
  reset: '↺'
};

// 建立 SVG Icon 元素（預留擴充）
export function createIcon(name, size = 20) {
  const iconMap = {
    // 未來可加入 Lucide Icons 的 SVG 路徑
  };

  if (iconMap[name]) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = iconMap[name];
    return svg;
  }

  return null;
}
