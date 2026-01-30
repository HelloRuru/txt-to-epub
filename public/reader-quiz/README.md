# 電子書閱讀器選購測驗

根據你的閱讀習慣、預算和需求，推薦適合的電子書閱讀器。

## 檔案結構

```
reader-quiz/
├── index.html          # 主頁面（含 SEO）
├── style.css           # 樣式（Design System v1.3）
├── js/
│   ├── main.js         # 入口、初始化、狀態管理
│   ├── icons.js        # SVG 圖標定義
│   ├── render.js       # UI 渲染
│   └── recommendation.js # 推薦邏輯
└── data/
    ├── meta.json       # 版本資訊
    ├── devices.json    # 機型資料 ← 更新機型改這裡
    ├── questions.json  # 題目文字 ← 改題目改這裡
    ├── rules.json      # 推薦規則
    └── tips.json       # 提示與資源
```

## 維護指南

### 修改題目文字
編輯 `data/questions.json`，每個題目格式：
```json
{
  "id": "budget",
  "question": "你的預算範圍是？",
  "description": "價格區間會幫助篩選適合的機型",
  "options": [
    {
      "id": "low",
      "text": "6,000 元以下",
      "icon": "piggy-bank",
      "description": "入門體驗，先試試水溫"
    }
  ]
}
```

### 新增/更新機型
編輯 `data/devices.json`，每台機型格式：
```json
{
  "id": "kobo-clara-bw",
  "name": "Kobo Clara BW",
  "brand": "Kobo",
  "price": 4899,
  "screen": { "size": 6, "type": "black-white", "ppi": 300 },
  "weight": 174,
  "storage": 16,
  "system": "closed",
  "waterproof": true,
  "features": ["IPX8 防水", "ComfortLight PRO"],
  "bestFor": ["novel", "commute", "budget"],
  "platform": "Kobo/樂天書城",
  "origin": "海外品牌",
  "pros": ["輕巧好攜帶", "操作直覺"],
  "cons": ["不能裝其他 APP"]
}
```

### 調整推薦邏輯
編輯 `js/recommendation.js` 中的 `calculateRecommendation()` 函數。

### 更新提示文字
編輯 `data/tips.json`。

## 可用圖標
在 `js/icons.js` 中定義，包含：
- 通用：book-open, check-circle, arrow-right, arrow-left, refresh-cw, target, lightbulb
- 規格：monitor, weight, hard-drive, shield
- 問題選項：seedling, mobile, sync, store, layers, scroll, compass, file-text, image, palette, file, newspaper, train, home, droplet, droplets, briefcase, piggy-bank, wallet, gem, infinity, smile, puzzle, flag, feather, pen-tool

## 版本
- v2.1.0 (2026-01-30) - 模組化重構

## 致謝
內容參考自 DiDaDi 的電子書閱讀器選購指南。
