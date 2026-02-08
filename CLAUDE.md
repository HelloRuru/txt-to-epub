# CLAUDE.md — HelloRuru 全域專案指引

> Claude Code / Happy Coder 進入任何 HelloRuru repo 時自動讀取此檔案。
> 部署位置：`~/CLAUDE.md`（所有 repo 的共同上層）
> 最後更新：2026-02-07

---

## 品牌概述

- **品牌**：Hello Ruru（ハロー・ルル）
- **擁有者**：Kaoru Tsai (Ruru)
- **調性**：溫柔、質感、日系文青、簡約
- **語言**：繁體中文（台灣），所有使用者面向文字皆使用繁體中文
- **技術棧**：純 HTML + CSS + JavaScript
- **Design System**：v1.7（字重修正 + 品牌頁首）

---

## 架構原則（最高優先）

> **每個工具/網站必須是完全獨立的靜態站點。無例外。**

### 標準結構

每個工具擁有獨立資料夾，包含自己的 `index.html`、`style.css`、`js/`、`data/`：

```
public/工具名/
├── index.html       ← 獨立入口
├── style.css        ← 獨立樣式
├── js/              ← 獨立邏輯
│   ├── main.js
│   └── ...
└── data/            ← 獨立資料（如需要）
```

### 正確範例

| 工具 | 位置 |
|------|------|
| SD 咒語產生器 | `tools/public/spell/` |
| 問安圖產生器 | `tools/public/hihi/` |
| 閱讀器選購測驗 | `tools/public/reader-quiz/` |

### 禁止事項

- **禁止**將多個工具整合進同一個框架（React、Vue 等）或共用入口
- **禁止**讓工具之間共用路由、狀態管理、或打包流程
- **禁止**未經 Ruru 確認就決定工具的架構方式

### 已完成遷移

- Post Writer 已從 React SPA 抽出為 `public/post-writer/` 獨立版（2026-02-08）
- `src/` 內 React 版殘留檔案待清理

---

## Repository 總覽

| Repo | 部署目標 | 說明 |
|------|----------|------|
| `tools` | Cloudflare Pages → `tools.helloruru.com` | 工具集（含閱讀器測驗） |
| `helloruru.github.io` | GitHub Pages → `lab.helloruru.com` | 品牌主站 |
| `happy-exit` | Cloudflare Pages → `newday.helloruru.com` | 離職導航工具 |
| `ruru-portfolio` | — | 作品集 |
| `keyword-pro` | — | 關鍵字工具 |
| `Ruru-Fate` | — | 命理工具 |
| `helloruru` | Private | 品牌核心 |
| `Ruru-Workspace` | Private | 工作空間 |
| `Suno-Music-Projects` | Private | 音樂專案 |
| `Ruru-work` | Private | 工作相關 |
| `Ruru-report` | Private | 報告文件 |

---

## Design System v1.7（完整摘要）

完整規格見 GitHub：https://github.com/HelloRuru/helloruru.github.io/blob/main/docs/DESIGN-SYSTEM.md

> **v1.7 更新（2026-02-07）**：字重修正（禁用 300）、品牌頁首 Web Component 標準化、Icon 系統規範
>
> **v1.6 更新（2026-02-06）**：全面更換為源泉圓體（GenSenRounded TW），解決鋸齒問題，OFL 授權商用免費

### 色彩系統

**主色調**

| 用途 | 名稱 | 色碼 |
|------|------|------|
| 主色 | Rose | `#D4A5A5` |
| 次色 | Lavender | `#B8A9C9` |

**粉色系**

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 腮紅粉 | `#F5D0C5` | 背景輔助、淺色卡片 |
| 灰玫瑰 | `#C9929A` | 卡片 icon、標籤、按鈕 hover |
| 撫子粉 | `#E8B4B8` | hover 狀態、裝飾 |
| 櫻花粉 | `#FEDFE1` | 淺背景、提示框 |

**紫色系**

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 藕荷 | `#9B7E93` | 文字輔助、hover |
| 藤紫 | `#C4B7D7` | 淺紫背景、分隔線 |
| 桔梗紫 | `#8F77B5` | 深紫強調、連結 |

**中性色**

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 鼠尾草綠 | `#A8B5A0` | 對比撞色、成功狀態 |
| 霧灰 | `#E8E4E1` | 背景底色、分隔 |
| 暖灰 | `#B5ADA7` | 禁用狀態、邊框 |
| 炭灰 | `#5C5856` | 深色文字 |

**文字色階**

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 墨色 | `#333333` | 標題文字 |
| 炭灰 | `#4A4A4A` | 內文文字 |
| 灰石 | `#888888` | 說明文字 |
| 淺灰 | `#AAAAAA` | 註解、placeholder |

**背景色**：`#FAFAFA` 淺背景 / `#FFFFFF` 卡片

**漸層**

| 名稱 | CSS |
|------|-----|
| 主漸層 | `linear-gradient(135deg, #D4A5A5, #B8A9C9)` |
| 淺漸層 | `linear-gradient(180deg, #FFFFFF, #FAFAFA)` |
| 粉紫漸層 | `linear-gradient(135deg, #F5D0C5, #C4B7D7)` |

### 字體系統

> **v1.7 更新（2026-02-07）**：明確禁用 `font-weight: 300`。GenSenRounded 僅提供 400/500/700 三個字重，使用 300 會導致瀏覽器 fallback 不一致，造成同一行文字粗細混亂。
>
> **v1.6 更新（2026-02-06）**：全面更換為源泉圓體（GenSenRounded），解決獅尾四季春鋸齒問題

| 用途 | 字體 | 字重 | Fallback | 說明 |
|------|------|------|----------|------|
| 標題（H1, H2） | 源泉圓體 | 700 Bold | Noto Sans TC | 圓潤溫柔，基於思源黑體 |
| 內文（H3, p） | 源泉圓體 | **500 Medium** | Noto Sans TC | 清晰好讀，無鋸齒 |
| 輕量文字 | 源泉圓體 | 400 Regular | Noto Sans TC | 副標題、說明文字 |
| 小字（≤12px） | Noto Sans TC | 400 Regular | sans-serif | 確保清晰 |
| 程式碼 | JetBrains Mono | 400 | Fira Code | 等寬字體 |

**可用字重**：400 Regular / **500 Medium（內文預設）** / 700 Bold

**字重禁止事項**：
- **禁止 `font-weight: 300`**（GenSenRounded 無此字重，會造成混合字體渲染）
- **禁止 `font-weight: 100/200`**（同上）
- **禁止 `font-weight: 600/800/900`**（GenSenRounded 無此字重）
- 所有 CSS 中的 `font-weight` 值只能使用 `400`、`500`、`700`

**字體 CDN**：`https://lab.helloruru.com/fonts/`
- `GenSenRounded-Regular.woff2` (400)
- `GenSenRounded-Medium.woff2` (500)
- `GenSenRounded-Bold.woff2` (700)

### 字級系統

| 層級 | 桌面版 | 手機版 | 字重 | 行高 |
|------|--------|--------|------|------|
| H1 | 40px | 30px | 700 | 1.3 |
| H2 | 28px | 24px | 500 | 1.3 |
| H3 | 20px | 18px | 500 | 1.3 |
| Body | 16px | 16px | **500** | 1.8 |
| Small | 14px | 14px | 500 | 1.6 |
| Caption | 12px | 12px | 400 | 1.6 |

### 圓角系統

| 元素 | 圓角 | CSS 變數 |
|------|------|----------|
| 按鈕 | 24px | `--radius-lg` |
| 卡片 | 24px | `--radius-lg` |
| 輸入框 | 12px | `--radius-md` |
| 標籤/Badge | 8px | `--radius-sm` |
| 頭像 | 50% | `--radius-full` |

### 陰影系統

| 層級 | CSS | 用途 |
|------|-----|------|
| 輕柔 | `0 2px 8px rgba(0,0,0,0.06)` | 卡片、按鈕 hover |
| 中等 | `0 4px 16px rgba(0,0,0,0.08)` | 彈出層、下拉選單 |
| 深層 | `0 8px 32px rgba(0,0,0,0.12)` | Modal、Toast |

### Icon 規範

- SVG 線條風格（Stroke 1.5–2px）
- 來源：Lucide Icons 優先，或自繪
- 尺寸：16px / 20px / 24px
- 顏色：繼承 `currentColor` 或品牌色
- **禁止 Emoji 作為 UI 圖示**
- **禁止填充 Icon**

### 深淺模式

必須支援 Light / Dark Mode 切換，CSS 變數定義見 Design System 完整文件。

### 響應式斷點

| 裝置 | 斷點 |
|------|------|
| Desktop | ≥1024px |
| Tablet | 768px – 1023px |
| Mobile | <768px |

---

## 品牌頁首（全站統一）

> **v1.7 新增（2026-02-07）**：所有公開工具網站必須使用統一的品牌頁首 Web Component。

### Web Component

**CDN**：`https://lab.helloruru.com/shared/brand-header.js`
**原始碼**：`~/helloruru.github.io/shared/brand-header.js`

### 使用方式

```html
<script src="https://lab.helloruru.com/shared/brand-header.js"></script>
<hello-ruru-header title="網站標題"></hello-ruru-header>
```

### 屬性

| 屬性 | 說明 | 預設值 |
|------|------|--------|
| `title` | 網站標題文字 | （無） |
| `href` | Logo 連結目標 | `https://lab.helloruru.com` |

### 功能

- 花朵 Logo SVG + "Hello Ruru" 粉紫漸層文字 + 網站標題
- Shadow DOM 隔離樣式，不影響各站 CSS
- GenSenRounded 字體（自帶載入）
- 更新 `brand-header.js` 即全站同步

### 適用範圍

| 網站 | title 屬性 | 是否必要 |
|------|-----------|----------|
| `tools.helloruru.com/hihi/` | 問安圖產生器 | 必要 |
| `tools.helloruru.com/reader-quiz/` | 電子書閱讀器選購測驗 | 必要 |
| `tools.helloruru.com/spell/` | SD 咒語產生器 | 必要 |
| `newday.helloruru.com` | 離職全能導航幫手 | 必要 |
| `lab.helloruru.com` | —（已有完整花朵 Hero） | 不需要 |

### 間距規範

> **v1.7 新增（2026-02-08）**

品牌頁首與主內容之間必須保持至少 **24px** 間距，禁止緊貼。

```css
hello-ruru-header {
  display: block;
  margin-bottom: 28px;   /* 至少 24px，建議 28px */
}
```

- 品牌頁首使用 Shadow DOM，間距須由外部元素控制
- 所有工具站（tools、newday）皆須遵守

### 禁止事項

- 禁止各站自行實作品牌 Logo / Header（統一使用 Web Component）
- 禁止修改 Web Component 的 Shadow DOM 內部樣式
- 禁止移除品牌頁首
- 禁止主內容緊貼品牌頁首（至少 24px 間距）

---

## Footer 規範（全站統一，具法律效力）

### 標準格式

```
© {年份} Kaoru Tsai. All Rights Reserved. | Contact: hello@helloruru.com
```

### 年份顯示規則

| 情況 | 顯示 | 範例 |
|------|------|------|
| 當前年份 = 起始年份 | `{起始年份}` | `© 2026` |
| 當前年份 > 起始年份 | `{起始年份}–{當前年份}` | `© 2026–2027` |

**注意**：使用 en dash（–）而非連字號（-）

### HTML 實作

```html
<footer class="site-footer">
  <p>© <span id="footer-year"></span> Kaoru Tsai. All Rights Reserved. | Contact: <a href="mailto:hello@helloruru.com">hello@helloruru.com</a></p>
</footer>
<script>
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  document.getElementById('footer-year').textContent =
    currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`;
</script>
```

### Footer 樣式規範

| 項目 | 規範 |
|------|------|
| 字級 | 14px (Small) |
| 顏色 | `#888888` |
| 連結顏色 | `#D4A5A5` |
| 對齊 | 置中 |
| 間距 | `padding: 32px 0` |

### Footer 法律效力聲明

此 Footer 格式為 Kaoru Tsai 對其所有 Hello Ruru 品牌網站主張著作權的正式聲明。
- `© {年份} Kaoru Tsai. All Rights Reserved.` 構成合法的著作權聲明
- 所有公開網站（tools、lab、newday 等）必須包含此聲明
- 未經授權不得移除或修改著作權聲明
- Contact 資訊為必要欄位，不得省略

### Footer 禁止事項

| 錯誤 | 正確 |
|------|------|
| `All rights reserved.`（小寫） | `All Rights Reserved.`（大寫） |
| `Built with curiosity at HelloRuru` | 必須使用標準格式 |
| 缺少聯絡信箱 | 必須包含 `hello@helloruru.com` |
| `2026-2027`（連字號） | `2026–2027`（en dash） |

---

## tools repo 專屬：閱讀器測驗（reader-quiz）

### DiDaDi 致敬

閱讀器測驗的知識內容參考自 DiDaDi 的電子書閱讀器選購指南，必須在以下位置標註致敬：

1. **index.html** — 獨立的 `<footer class="site-credit">` 區塊（位於標準 Footer 上方）
2. **render.js** — 結果頁底部的致敬文字

致敬格式：
```html
<footer class="site-credit">
  <p>本測驗內容參考自 <a href="https://home.gamer.com.tw/artwork.php?sn=6140260" target="_blank" rel="noopener">DiDaDi 的電子書閱讀器選購指南</a></p>
  <p>感謝 Di 提供專業且詳盡的閱讀器知識整理</p>
</footer>
```

**重要**：DiDaDi 致敬僅適用於 reader-quiz，不適用於其他工具或網站。

### 專案結構

```
public/reader-quiz/
├── index.html
├── style.css
├── data/
│   ├── devices.json      ← 裝置資料庫（核心）
│   ├── questions.json    ← 測驗問題
│   ├── rules.json        ← 推薦規則
│   ├── tips.json         ← 結果頁提示
│   └── meta.json         ← 資料庫版本資訊
└── js/
    ├── main.js           ← 進入點
    ├── recommendation.js ← 推薦邏輯
    ├── render.js         ← UI 渲染
    └── icons.js          ← SVG 圖標定義
```

### 裝置資料庫規範（devices.json）

**收錄條件**

1. 近 2–3 年內發售的新機型
2. 目前仍可購買（非停產品）
3. 購買連結必須指向**台灣正式經銷商**或**製造商官網**

**已知台灣正式管道**

| 品牌 | 經銷管道 | URL |
|------|----------|-----|
| Kobo | 樂天 Kobo 官網 | `kobo.com/zh/...` |
| Readmoo | Readmoo 官網 | `readmoo.com/mooink-series` |
| HyRead | HyRead 官網 | `gaze.hyread.com.tw` |
| 文石 BOOX | 熊老闆（台灣經銷商） | `boox.com.tw` |
| Amazon Kindle | Amazon 官網 | `amazon.com/kindle` |
| iReader | iReader 官網 | `ireader.com` |

**資料欄位**

```json
{
  "id": "kobo-libra-colour",
  "name": "Kobo Libra Colour",
  "brand": "Kobo",
  "screenSize": 7,
  "screenType": "color",
  "hasStylus": false,
  "hasFrontLight": true,
  "hasWaterproof": true,
  "storageGB": 32,
  "weightGrams": 199,
  "priceRange": "mid",
  "openSystem": false,
  "primaryUse": ["reading"],
  "purchaseUrl": "https://...",
  "features": ["color", "waterproof"],
  "tags": ["best-value", "color-reading"]
}
```

**維護注意**

- 新增裝置前先確認是否符合收錄條件
- 停產裝置應移除，不保留
- `purchaseUrl` 每季應驗證一次是否仍可連線
- **Kobo Sage 已停產，不得收錄**

---

## Git 規範

### Commit 訊息格式

```
<type>: <簡述>

<詳細說明（選填）>
```

常用 type：
- `feat`: 新功能
- `fix`: 修復
- `data`: 資料庫更新（devices.json 等）
- `style`: 樣式調整
- `docs`: 文件更新
- `refactor`: 重構

**語言規則**：使用中文或中英混合，**禁止純英文**描述。

範例：`data: 移除已停產 Kobo Sage，新增 mooInk Chill`

### 分支

- `main` 為正式分支，直接部署
- 大改動建議開 feature branch 再 merge

---

## 全域禁止事項

1. 禁止使用 Emoji 作為 UI 元素（用 SVG Icon）
2. 禁止使用純黑 `#000000`（用 `#333333` 或 `#4A4A4A`）
3. 禁止使用直角 0px 圓角（最小 8px）
4. 禁止使用系統預設字體（必須載入指定字體）
5. 禁止使用高對比強烈陰影（保持輕柔低對比）
6. 禁止使用非規範色彩
7. 禁止在 commit 中使用純英文描述
8. 禁止收錄已停產裝置（tools repo）
9. 禁止使用非台灣正式經銷商的購買連結（tools repo）
10. 禁止省略或修改 Footer 著作權聲明
11. 禁止非標準 Footer 格式
12. 禁止使用 `font-weight: 300` 或其他 GenSenRounded 不支援的字重（僅限 400/500/700）
13. 禁止各站自行實作品牌 Header（必須使用 `<hello-ruru-header>` Web Component）
14. 禁止將工具整合進共用框架或共用入口頁面（每個工具必須獨立）
15. 禁止主內容緊貼品牌頁首（至少保持 24px 間距）
16. 若不確定架構方式，必須先與 Ruru 確認

---

## 相關資源

- Design System v1.7 完整文件：https://github.com/HelloRuru/helloruru.github.io/blob/main/docs/DESIGN-SYSTEM.md
- 品牌頁首 Web Component：`https://lab.helloruru.com/shared/brand-header.js`
- 線上版（閱讀器測驗）：https://tools.helloruru.com/reader-quiz/
- 線上版（SD 咒語產生器）：https://tools.helloruru.com/spell/
- 品牌主站：https://lab.helloruru.com
- 工具站：https://newday.helloruru.com
