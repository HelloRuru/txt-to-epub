# Find-Color — 2026 流行色：數位色票庫

> 精選 2026 流行色組，一鍵複製 HEX 碼，即時預覽網站配色效果

## ✨ 功能特色

- **5 組精選配色**：Hello Ruru 品牌色、莫蘭迪色系、大地色系、清新綠意、專業商務
- **用途標註**：每個顏色清楚標示適合用途（背景/標題/內文/按鈕/提示）
- **一鍵複製**：點擊任何色塊即可複製 HEX 色碼
- **即時預覽**：點擊「套用預覽」查看整個網站配色效果
- **響應式設計**：完美支援桌面/平板/手機

## 📁 專案結構

```
find-color/
├── index.html              # 主頁面
├── favicon.svg             # 品牌圖標
├── css/                    # 樣式模組
│   ├── base.css            # 變數、字體、Reset
│   ├── layout.css          # 版面配置
│   ├── accessibility.css   # 無障礙樣式
│   ├── responsive.css      # 響應式佈局
│   └── components/         # 元件樣式
│       ├── hero.css        # Hero 區域
│       ├── palette.css     # 色組卡片
│       ├── preview.css     # 預覽區域
│       ├── toast.css       # Toast 通知
│       └── footer.css      # 頁尾
└── js/                     # JavaScript 模組
    ├── main.js             # 主入口
    ├── core/               # 核心邏輯
    │   └── render.js       # 渲染色組卡片
    ├── data/               # 資料檔案
    │   └── palettes.js     # 色組資料庫
    ├── features/           # 功能模組
    │   ├── copy.js         # 複製 HEX 功能
    │   └── preview.js      # 即時預覽功能
    └── utils/              # 工具模組
        └── icons.js        # SVG 圖標
```

## 🎨 色組說明

### 1. Hello Ruru 品牌色
溫柔質感的粉紫色系，適合女性向、文青風格網站

### 2. 莫蘭迪色系
低飽和度高級灰，適合品牌官網、作品集

### 3. 大地色系
自然溫暖，適合永續品牌、生活風格網站

### 4. 清新綠意
活力清爽，適合健康、教育、環保主題

### 5. 專業商務
沈穩可信，適合企業官網、金融科技

## 🚀 本地測試

1. **啟動本地伺服器**（推薦使用 Python）：
   ```bash
   cd ~/tools/public/find-color
   python3 -m http.server 8000
   ```

2. **開啟瀏覽器**：
   ```
   http://localhost:8000
   ```

3. **測試功能**：
   - 點擊色塊複製 HEX 碼
   - 點擊「套用預覽」查看即時效果
   - 點擊「返回原配色」重置

## 📦 部署

此工具為純靜態站點，可部署至：
- **Cloudflare Pages**（推薦）
- **GitHub Pages**
- **Netlify**
- 任何支援靜態檔案的主機

部署 URL：`https://tools.helloruru.com/find-color/`

## 🔧 技術棧

- **HTML5** — 語意化結構
- **CSS3** — 模組化樣式 + CSS 變數
- **Vanilla JavaScript** — ES6 Modules
- **GenSenRounded** — 源泉圓體字型
- **Hello Ruru Design System v1.7** — 品牌規範

## 📝 維護指南

### 新增色組

編輯 `js/data/palettes.js`：

```javascript
{
  id: 'new-palette',
  name: '新色組名稱',
  description: '色組說明',
  colors: {
    background: '#FFFFFF',
    heading: '#333333',
    text: '#666666',
    button: '#0066CC',
    accent: '#FF6600'
  },
  usage: {
    background: '背景',
    heading: '標題',
    text: '內文',
    button: '按鈕',
    accent: '提示/強調'
  }
}
```

### 修改樣式

所有樣式模組化存放於 `css/` 目錄，可依需求編輯對應檔案。

## 📄 授權

© 2026 Kaoru Tsai. All Rights Reserved.

---

**部署位置**：`tools.helloruru.com/find-color/`
**專案位置**：`~/tools/public/find-color/`
**建立日期**：2026-02-10
