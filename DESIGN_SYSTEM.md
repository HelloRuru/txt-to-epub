# HelloRuru Design System v1.0

## 色彩系統

### 主色調（少女風格）

| 名稱 | 色碼 | CSS 變數 | 用途 |
|------|------|----------|------|
| Rose 乾燥玫瑰 | `#D4A5A5` | `--rose` | 主強調色 |
| Lavender 薰衣草 | `#B8A9C9` | `--lavender` | 次強調色 |
| Dusty Rose 灰玫瑰 | `#C9929A` | `--dusty-rose` | 第三強調色 |
| Blush 腮紅粉 | `#F5D0C5` | `--blush` | 背景輔助 |
| Cream 奶油白 | `#FDF6F0` | `--cream` | 淺色背景 |
| Mauve 藕荷 | `#9B7E93` | `--mauve` | 深色輔助 |
| Sage 鼠尾草綠 | `#A8B5A0` | `--sage` | 對比撞色 |

---

## 字體

| 用途 | 字體 | 備註 |
|------|------|------|
| 標題 / 品牌 | GenWanMin (源雲明體) | Serif，優雅風格 |
| UI / 內文 | Noto Sans TC | Sans-serif，易讀性 |

---

## 圓角

| 元素 | 圓角值 | Tailwind Class |
|------|--------|----------------|
| 卡片 | 24px | `rounded-3xl` |
| 按鈕 | 全圓 | `rounded-full` |
| 輸入框 | 16px | `rounded-2xl` |
| 小元件 | 12px | `rounded-xl` |

---

## Icon 規範

- ✅ 使用 SVG 線條風格 (stroke-based)
- ✅ strokeWidth: 1.5 ~ 2
- ✅ strokeLinecap: round
- ✅ strokeLinejoin: round
- ❌ **禁止使用 Emoji**（📖 ✿ ①②③ 等）

---

## 卡片樣式

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow);
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
}

/* Hover 時顯示頂部漸層條 */
.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--rose), var(--lavender));
  border-radius: 24px 24px 0 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.card:hover::before {
  opacity: 1;
}
```

---

## 深色模式

支援 `prefers-color-scheme: dark`，透過 CSS 變數自動切換：

| 變數 | Light | Dark |
|------|-------|------|
| `--bg-primary` | `#FDF6F0` | `#1a1a1a` |
| `--bg-card` | `#ffffff` | `#2a2a2a` |
| `--text-primary` | `#333333` | `#f0f0f0` |
| `--border` | `#e8d8d0` | `#3a3a3a` |

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

## 參考連結

- Google Doc: [Design System 完整文件](https://docs.google.com/document/d/1LMcBCcVKQOUYbqgpZ4LCeNsnEOYKKSXzske6w9y6q7U)
- GitHub: [HelloRuru/tools](https://github.com/HelloRuru/tools)
