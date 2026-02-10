// 2026 流行色組資料庫 — 8 地區 × 2 模式 = 16 組配色
// 使用國際標準色名 | Sources: Pantone 2026, Pinterest 2026

export const palettes = [
  // ========== 1. Global ==========
  {
    id: 'cloud-dancer-light',
    name: 'Cloud Dancer — Light',
    description: 'Pantone 2026 Color of the Year, minimalist white',
    colors: {
      background: '#FEFEFE',
      heading: '#8B8680',
      text: '#4A4A4A',
      button: '#A8A29D',
      accent: '#D4D0CC'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Global',
    mode: 'light',
    source: 'Pantone 2026'
  },
  {
    id: 'cloud-dancer-dark',
    name: 'Cloud Dancer — Dark',
    description: 'Pantone 2026 dark mode variant',
    colors: {
      background: '#1A1A1A',
      heading: '#D4D0CC',
      text: '#E8E4E1',
      button: '#8B8680',
      accent: '#A8A29D'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Global',
    mode: 'dark',
    source: 'Pantone 2026'
  },

  // ========== 2. Western ==========
  {
    id: 'plum-noir-light',
    name: 'Plum Noir — Light',
    description: 'Pinterest 2026, moody maximalism',
    colors: {
      background: '#F8F5F4',
      heading: '#5D3A4D',
      text: '#3D2832',
      button: '#8B5A73',
      accent: '#C19AA8'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Western',
    mode: 'light',
    source: 'Pinterest 2026'
  },
  {
    id: 'plum-noir-dark',
    name: 'Plum Noir — Dark',
    description: 'Deep burgundy night variant',
    colors: {
      background: '#2A1B24',
      heading: '#C19AA8',
      text: '#E8D5DE',
      button: '#8B5A73',
      accent: '#D4A5B8'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Western',
    mode: 'dark',
    source: 'Pinterest 2026'
  },

  // ========== 3. Japanese ==========
  {
    id: 'sakura-beige-light',
    name: 'Sakura Beige — Light',
    description: 'Japanese traditional colors, wabi-sabi aesthetic',
    colors: {
      background: '#FAF7F5',
      heading: '#8B6F5C',
      text: '#4A4238',
      button: '#7FA890',
      accent: '#F5D0C5'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Japanese',
    mode: 'light',
    source: 'NIPPON COLORS'
  },
  {
    id: 'charcoal-sumi-dark',
    name: 'Charcoal Sumi — Dark',
    description: 'Japanese ink black variant',
    colors: {
      background: '#2C2824',
      heading: '#D4C0B0',
      text: '#E8DDD5',
      button: '#8B9B8A',
      accent: '#C9929A'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Japanese',
    mode: 'dark',
    source: 'NIPPON COLORS'
  },

  // ========== 4. Taiwan ==========
  {
    id: 'coral-red-light',
    name: 'Coral Red — Light',
    description: 'Taiwan cultural colors, warm tropical',
    colors: {
      background: '#FFF9F5',
      heading: '#C75B3F',
      text: '#4A3833',
      button: '#7FA890',
      accent: '#FFB89A'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Taiwan',
    mode: 'light',
    source: 'Taiwan Cultural Colors'
  },
  {
    id: 'brick-red-dark',
    name: 'Brick Red — Dark',
    description: 'Taiwan temple architecture variant',
    colors: {
      background: '#2A1F1B',
      heading: '#E67856',
      text: '#F5E5D8',
      button: '#8B9B8A',
      accent: '#FFB89A'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Taiwan',
    mode: 'dark',
    source: 'Taiwan Cultural Colors'
  },

  // ========== 5. Korean ==========
  {
    id: 'mauve-light',
    name: 'Mauve — Light',
    description: 'K-beauty soft morandi tones',
    colors: {
      background: '#F7F5F3',
      heading: '#9B7E93',
      text: '#5C5856',
      button: '#C4B7D7',
      accent: '#E8B4B8'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Korean',
    mode: 'light',
    source: 'K-beauty 2026'
  },
  {
    id: 'mauve-dark',
    name: 'Mauve — Dark',
    description: 'Deep mauve night variant',
    colors: {
      background: '#2D2826',
      heading: '#C4B7D7',
      text: '#E8DDD8',
      button: '#9B7E93',
      accent: '#D4A5A5'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Korean',
    mode: 'dark',
    source: 'K-beauty 2026'
  },

  // ========== 6. Nordic ==========
  {
    id: 'cool-blue-light',
    name: 'Cool Blue — Light',
    description: 'Pinterest 2026, Scandinavian minimalism',
    colors: {
      background: '#F7FAFB',
      heading: '#3D5A6B',
      text: '#2D3E48',
      button: '#5B8AA1',
      accent: '#A3C9D9'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Nordic',
    mode: 'light',
    source: 'Pinterest 2026'
  },
  {
    id: 'navy-dark',
    name: 'Navy — Dark',
    description: 'Nordic polar night variant',
    colors: {
      background: '#1F2A32',
      heading: '#A3C9D9',
      text: '#D4E5ED',
      button: '#5B8AA1',
      accent: '#7BA8BF'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Nordic',
    mode: 'dark',
    source: 'Pinterest 2026'
  },

  // ========== 7. Mediterranean ==========
  {
    id: 'persimmon-light',
    name: 'Persimmon — Light',
    description: 'Pinterest 2026, Mediterranean warmth',
    colors: {
      background: '#FFF9F5',
      heading: '#C75B3F',
      text: '#4A3833',
      button: '#E67856',
      accent: '#FFB89A'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Mediterranean',
    mode: 'light',
    source: 'Pinterest 2026'
  },
  {
    id: 'terracotta-dark',
    name: 'Terracotta — Dark',
    description: 'Tuscan sunset variant',
    colors: {
      background: '#2A1F1B',
      heading: '#FFB89A',
      text: '#F5E5D8',
      button: '#E67856',
      accent: '#FFC8A8'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Mediterranean',
    mode: 'dark',
    source: 'Pinterest 2026'
  },

  // ========== 8. Middle East ==========
  {
    id: 'gold-light',
    name: 'Gold — Light',
    description: 'Middle Eastern luxury, gold & sapphire',
    colors: {
      background: '#FFF9F2',
      heading: '#8B6914',
      text: '#3D3421',
      button: '#2C5282',
      accent: '#D4AF37'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Middle East',
    mode: 'light',
    source: 'Middle Eastern Design 2026'
  },
  {
    id: 'sapphire-dark',
    name: 'Sapphire — Dark',
    description: 'Palace night variant, deep blue & gold',
    colors: {
      background: '#1A1510',
      heading: '#D4AF37',
      text: '#F5E5C8',
      button: '#4A90E2',
      accent: '#FFD700'
    },
    usage: {
      background: '背景',
      heading: '標題',
      text: '內文',
      button: '按鈕',
      accent: '提示/強調'
    },
    region: 'Middle East',
    mode: 'dark',
    source: 'Middle Eastern Design 2026'
  }
];

// Default palette
export const defaultPalette = palettes[0];

// Group by region with Light/Dark pairs
export const paletteGroups = [
  {
    region: 'Global',
    name: 'Cloud Dancer',
    nameCn: '雲舞者',
    light: palettes.find(p => p.id === 'cloud-dancer-light'),
    dark: palettes.find(p => p.id === 'cloud-dancer-dark')
  },
  {
    region: 'Western',
    name: 'Plum Noir',
    nameCn: '深梅紫',
    light: palettes.find(p => p.id === 'plum-noir-light'),
    dark: palettes.find(p => p.id === 'plum-noir-dark')
  },
  {
    region: 'Japanese',
    name: 'Sakura Beige / Charcoal Sumi',
    nameCn: '櫻花米 / 炭墨',
    light: palettes.find(p => p.id === 'sakura-beige-light'),
    dark: palettes.find(p => p.id === 'charcoal-sumi-dark')
  },
  {
    region: 'Taiwan',
    name: 'Coral Red / Brick Red',
    nameCn: '珊瑚紅 / 磚紅',
    light: palettes.find(p => p.id === 'coral-red-light'),
    dark: palettes.find(p => p.id === 'brick-red-dark')
  },
  {
    region: 'Korean',
    name: 'Mauve',
    nameCn: '木槿紫',
    light: palettes.find(p => p.id === 'mauve-light'),
    dark: palettes.find(p => p.id === 'mauve-dark')
  },
  {
    region: 'Nordic',
    name: 'Cool Blue / Navy',
    nameCn: '冷藍 / 海軍藍',
    light: palettes.find(p => p.id === 'cool-blue-light'),
    dark: palettes.find(p => p.id === 'navy-dark')
  },
  {
    region: 'Mediterranean',
    name: 'Persimmon / Terracotta',
    nameCn: '柿橙 / 陶土',
    light: palettes.find(p => p.id === 'persimmon-light'),
    dark: palettes.find(p => p.id === 'terracotta-dark')
  },
  {
    region: 'Middle East',
    name: 'Gold / Sapphire',
    nameCn: '金色 / 藍寶石',
    light: palettes.find(p => p.id === 'gold-light'),
    dark: palettes.find(p => p.id === 'sapphire-dark')
  }
];
