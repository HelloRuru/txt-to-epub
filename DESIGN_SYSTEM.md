# HelloRuru Design System v1.8

## 概述

此為 HelloRuru 品牌的統一設計規範，適用於所有子網站與工具頁面。
完整規範見 `d:\RURU-ALL\HelloRuru-Website\DESIGN-SYSTEM-v1.8.md`。

---

## 色彩系統

### 主色調（少女風格）

| 名稱 | 色碼 | 用途 |
|------|------|------|
| Rose 乾燥玫瑰 | `#D4A5A5` | 主強調色 |
| Lavender 薰衣草 | `#B8A9C9` | 次強調色 |
| Dusty Rose 灰玫瑰 | `#C9929A` | 第三強調色 |
| Blush 腮紅粉 | `#F5D0C5` | 背景輔助 |
| Cream 奶油白 | `#FDF6F0` | 淺色背景 |
| Mauve 藕荷 | `#9B7E93` | 深色輔助 |
| Sage 鼠尾草綠 | `#A8B5A0` | 對比撞色 |

### Light Mode

```css
--bg-primary: #FFFCFA;
--bg-secondary: #FDF6F0;
--bg-card: #FFFFFF;
--text-primary: #3D3535;
--text-secondary: #6B5B5B;
--text-muted: #A09090;
--accent-primary: #D4A5A5;
--accent-secondary: #B8A9C9;
--accent-tertiary: #C9929A;
--border: rgba(212, 165, 165, 0.15);
--shadow: 0 4px 24px rgba(212, 165, 165, 0.12);
--shadow-hover: 0 12px 48px rgba(212, 165, 165, 0.2);
```

### Dark Mode

```css
--bg-primary: #1E1A1D;
--bg-secondary: #2A2428;
--bg-card: #322C30;
--text-primary: #F5EDE9;
--text-secondary: #C5B5B0;
--text-muted: #8A7A75;
--accent-primary: #E8B4B8;
--accent-secondary: #C9B8D4;
--accent-tertiary: #D4A0A8;
--border: rgba(232, 180, 184, 0.1);
--shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
--shadow-hover: 0 12px 48px rgba(232, 180, 184, 0.15);
```

---

## 字體系統

### 字體家族（v1.8 統一）

| 用途 | 字體 | 字重 | 備援 |
|------|------|------|------|
| 全站 | GenSenRounded（源泉圓體） | 400/500/700 | Noto Sans TC, sans-serif |

### 字體引入

```css
/* 源泉圓體 GenSenRounded TW（OFL 商用免費） */
@font-face {
    font-family: 'GenSenRounded';
    src: url('https://lab.helloruru.com/fonts/GenSenRounded-Regular.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
}
@font-face {
    font-family: 'GenSenRounded';
    src: url('https://lab.helloruru.com/fonts/GenSenRounded-Medium.woff2') format('woff2');
    font-weight: 500;
    font-display: swap;
}
@font-face {
    font-family: 'GenSenRounded';
    src: url('https://lab.helloruru.com/fonts/GenSenRounded-Bold.woff2') format('woff2');
    font-weight: 700;
    font-display: swap;
}
```

### 字級規範

| 層級 | 字重 | 大小 | 行高 |
|------|------|------|------|
| H1 | 700 | clamp(48px, 10vw, 88px) | 1.1 |
| H2 | 700 | 22-26px | 1.3 |
| H3 | 500 | 18-20px | 1.4 |
| 內文 | 500 | 14-16px | 1.9 |
| 標籤/UI | 400 | 11-14px | 1.5 |

---

## 元件規範

### 圓角

| 元件 | 圓角值 |
|------|--------|
| 卡片 | 24px |
| 按鈕（大） | 100px（膠囊形） |
| 按鈕（小） | 100px |
| Icon 容器 | 50%（圓形） |
| 輸入框 | 100px |

### 陰影

```css
/* 預設 */
box-shadow: 0 4px 24px rgba(212, 165, 165, 0.12);

/* Hover */
box-shadow: 0 12px 48px rgba(212, 165, 165, 0.2);
```

### 漸層

```css
/* 主漸層（用於強調元素）*/
background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);

/* 三色漸層（用於大標題）*/
background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 50%, var(--accent-tertiary) 100%);
```

### 過渡動畫

```css
/* 標準過渡 */
transition: all 0.3s ease;

/* 彈性過渡（用於 hover 效果）*/
transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Icon 規範

### 風格

- ✅ 類型：線條 Icon（Stroke）
- ✅ 粗細：1.5-2px
- ✅ 來源：Lucide Icons 或自繪 SVG
- ❌ **禁止：Emoji、填充 Icon**

### Icon 容器

```css
.icon-container {
    width: 64-72px;
    height: 64-72px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(主色, 0.2), rgba(次色, 0.2));
}

.icon-container svg {
    width: 28-36px;
    height: 28-36px;
    stroke: var(--accent-color);
    stroke-width: 1.5;
    fill: none;
}
```

### Icon 顏色對應

| 類別 | Icon 底色 | Stroke 顏色 |
|------|----------|---------------|
| SEO | rose | #D4A5A5 |
| 電子書 | lavender | #B8A9C9 |
| 職涯 | dusty | #C9929A |
| 其他 | sage | #A8B5A0 |

---

## 卡片元件

### 基本卡片

```css
.card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border);
    padding: 28-32px;
    box-shadow: var(--shadow);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-hover);
}

/* Hover 時顯示頂部漸層邊條 */
.card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    opacity: 0;
    transition: opacity 0.3s ease;
}

.card:hover::before {
    opacity: 1;
}
```

---

## 按鈕元件

### 主要按鈕

```css
.btn-primary {
    padding: 12px 24px;
    border-radius: 100px;
    border: none;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(212, 165, 165, 0.3);
}

.btn-primary:hover {
    transform: scale(1.05);
}
```

### 次要按鈕

```css
.btn-secondary {
    padding: 12px 24px;
    border-radius: 100px;
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
}

.btn-secondary.active {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white;
    border-color: transparent;
}
```

---

## 響應式斷點

| 斷點 | 寬度 | 調整 |
|------|------|------|
| Desktop | > 900px | 預設 |
| Tablet | 641-900px | 卡片雙欄 |
| Mobile | ≤ 640px | 單欄、縮小間距 |

---

## 禁止事項

1. ❌ **禁止使用 Emoji** — 全部改用 SVG 線條 Icon
2. ❌ **禁止填充 Icon** — 只用 Stroke
3. ❌ **禁止重複字眼** — 如「XX相關」連續出現
4. ❌ **禁止過度格式化** — 保持簡潔
5. ❌ **禁止非規範色彩** — 嚴格遵守色彩系統

---

## 補充說明樣式

使用光芒符號 `✦` 作為列點：

```jsx
<span>✦ 所有處理都在瀏覽器中完成</span>
<span>✦ 關閉分頁後，資料自動清除</span>
```

---

## 版權格式

```
© 2026 Kaoru Tsai. All rights reserved.
```

---

## AI 快速指令

複製以下指令讓任何 AI 遵循此設計系統：

```
請依照 HelloRuru Design System v1.8 設計：
- 色系：乾燥玫瑰 #D4A5A5 + 薰衣草 #B8A9C9 漸層
- 字體：全站使用源泉圓體（GenSenRounded），400/500/700 三種字重
- Icon：SVG 線條風格（Lucide），禁止 Emoji
- 卡片：圓角 24px，hover 上移 8px + 頂部漸層邊條
- 支援深淺模式切換
- 圓形元素為主（Icon 容器、按鈕膠囊形）
```

---

## 參考連結

- [Design System 完整文件 (Google Doc)](https://docs.google.com/document/d/1LMcBCcVKQOUYbqgpZ4LCeNsnEOYKKSXzske6w9y6q7U)
- [HelloRuru/tools GitHub](https://github.com/HelloRuru/tools)

---

## 版本紀錄

| 版本 | 日期 | 變更 |
|------|------|------|
| 1.0 | 2026-01-29 | 初版建立 |
| 1.1 | 2026-01-30 | 同步 Google Doc 完整內容 |
| 1.8 | 2026-02-17 | 字體統一為 GenSenRounded，移除 GenWanMin/Huninn |
