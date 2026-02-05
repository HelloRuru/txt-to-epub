/**
 * recommendation.js - 推薦邏輯 v2.1
 * 補丁版本：修正 Platform 動態翻轉、預算邏輯、圖書館場景平衡
 */

// ========== 權重配置 ==========
const WEIGHT_CONFIG = {
  priority: 30,      // 優先特點（上限 30）
  budget: 30,        // 預算（上限 30）
  hardware: 25,      // 硬體規格（上限 25）
  platform: 35,      // 平台需求（上限 35）
  localization: 8    // 在地化加成（上限 8）
};

// 預算閾值對應 questions.json 的選項 ID
const BUDGET_THRESHOLDS = {
  low: 7000,      // 7,000 元以下
  mid: 12000,     // 12,000 元以下
  high: 18000     // 18,000 元以下
};

// ========== 系統類型判斷 ==========
function getSystemType(device) {
  if (device.openSystem === true || device.openSystem === 'open') return 'open';
  if (device.openSystem === 'semi-open') return 'semi-open';
  return 'closed';
}

// ========== 平台評分（動態翻轉）==========
function calculatePlatformScore(device, answers) {
  const platformAnswers = answers.platform || [];
  const systemType = getSystemType(device);
  let score = 0;

  // 單一平台偏好：封閉系統獲利
  if (platformAnswers.includes('single')) {
    if (systemType === 'closed') score += 12;
    else if (systemType === 'semi-open') score += 8;
    else if (systemType === 'open') score += 5;
  }

  // 多平台需求：開放系統獲利
  if (platformAnswers.includes('multi')) {
    if (systemType === 'open') score += 15;
    else if (systemType === 'semi-open') score += 10;
    else if (systemType === 'closed') score += 3;
  }

  // 圖書館借閱需求（獨立處理，確保 HyRead 優勢）
  if (platformAnswers.includes('library')) {
    if (device.brand === '凌網 HyRead') {
      score += 28; // HyRead 原生支援（基礎 +25，品牌 bonus +3）
    } else if (systemType === 'open') {
      score += 12; // 可裝 APP 達成，但非原生（從 +18 下修）
    } else if (systemType === 'semi-open') {
      score += 8;  // 可裝 APK 但需自行找安裝檔
    }
    // closed 系統（Kindle, Kobo）台灣無法使用 OverDrive，不加分
  }

  // 網路小說需求
  if (platformAnswers.includes('webnovel')) {
    if (systemType === 'open') score += 15;
    else if (systemType === 'semi-open') score += 10;
    else if (systemType === 'closed') score += 3;
  }

  // 網頁瀏覽需求
  if (platformAnswers.includes('browse')) {
    if (systemType === 'open') score += 15;
    else if (systemType === 'semi-open') score += 8;
  }

  // 尚未決定：三種系統都給適當分數
  if (platformAnswers.includes('undecided')) {
    if (systemType === 'open') score += 10;
    else if (systemType === 'semi-open') score += 8;
    else if (systemType === 'closed') score += 8;
  }

  // 多元書源加成（選 3 個以上平台需求）
  if (platformAnswers.length >= 3 && (systemType === 'open' || systemType === 'semi-open')) {
    score += 5;
  }

  return Math.min(score, WEIGHT_CONFIG.platform);
}

// ========== 預算評分 ==========
function calculateBudgetScore(device, answers) {
  const budgetAnswer = answers.budget;
  if (!budgetAnswer) return 0;

  const price = device.price;

  // flexible：所有機型一律 +20（不給滿分，避免高價機無條件碾壓）
  if (budgetAnswer === 'flexible') {
    return 20;
  }

  const threshold = BUDGET_THRESHOLDS[budgetAnswer];
  if (!threshold) return 0;

  // 機型價格 ≤ 該區間上限 → +30
  if (price <= threshold) {
    return 30;
  }

  // 機型價格超出上限但在 10% 以內 → +15
  if (price <= threshold * 1.1) {
    return 15;
  }

  // 機型價格超出上限 10% 以上 → +0
  return 0;
}

// ========== 硬體評分 ==========
function calculateHardwareScore(device, answers) {
  const contentAnswers = answers.content || [];
  const usageAnswers = answers.usage || [];
  let score = 0;

  const size = device.screenSize;
  const isColor = device.displayType.includes('彩色');

  // 內容類型 × 螢幕尺寸
  if (contentAnswers.includes('novel')) {
    if (size <= 7) score += 8;
  }

  if (contentAnswers.includes('manga-bw')) {
    if (size >= 7 && size <= 8) score += 8;
    if (device.verticalText === 'excellent') score += 5;
    else if (device.verticalText === 'good') score += 2;
  }

  if (contentAnswers.includes('manga-color')) {
    if (size >= 7.8) score += 5;
    if (isColor) score += 10;
  }

  if (contentAnswers.includes('pdf')) {
    if (size >= 10) score += 12;
  }

  if (contentAnswers.includes('magazine')) {
    if (size >= 10) score += 8;
    if (isColor) score += 5;
  }

  // 使用情境
  if (usageAnswers.includes('commute')) {
    if (size <= 7) score += 10;
  }

  if (usageAnswers.includes('home')) {
    if (size >= 7.8) score += 3;
  }

  if (usageAnswers.includes('work')) {
    if (device.stylus) score += 12;
    if (size >= 8) score += 5;
  }

  // 小說 + 漫畫混合閱讀
  if (contentAnswers.includes('novel') && (contentAnswers.includes('manga-bw') || contentAnswers.includes('manga-color'))) {
    if (size >= 7 && size <= 8) score += 3;
  }

  return Math.min(score, WEIGHT_CONFIG.hardware);
}

// ========== 優先特點評分 ==========
function calculatePriorityScore(device, answers) {
  const priorities = answers.priority || [];
  const systemType = getSystemType(device);
  let score = 0;

  // 操作簡單 → 封閉系統
  if (priorities.includes('easy')) {
    if (systemType === 'closed') score += 20;
    else if (systemType === 'semi-open') score += 10;
  }

  // 彈性擴充 → 開放系統
  if (priorities.includes('flexible')) {
    if (systemType === 'open') score += 20;
    else if (systemType === 'semi-open') score += 12;
  }

  // 輕巧好攜帶
  if (priorities.includes('light')) {
    if (device.screenSize <= 6.5) score += 15;
    else if (device.screenSize <= 7) score += 8;
  }

  // 實體按鍵
  if (priorities.includes('buttons')) {
    if (device.hasPhysicalButtons) score += 15;
  }

  // 手寫筆
  if (priorities.includes('pen')) {
    if (device.stylus) score += 20;
  }

  return Math.min(score, WEIGHT_CONFIG.priority);
}

// ========== 在地化評分 ==========
function calculateLocalizationScore(device, answers) {
  const priorities = answers.priority || [];
  let score = 0;

  // 台灣品牌偏好：統一 +8（上限，不可疊加）
  if (priorities.includes('taiwan')) {
    if (device.brand === '讀墨 Readmoo' || device.brand === '凌網 HyRead') {
      score += 8;
    }
  }

  return Math.min(score, WEIGHT_CONFIG.localization);
}

// ========== 排版評分（獨立於硬體）==========
function calculateTypesettingScore(device, answers) {
  const typesettingAnswer = answers.typesetting;
  const systemType = getSystemType(device);
  let score = 0;

  if (typesettingAnswer === 'flexible') {
    if (device.customFont) score += 15;
    if (systemType === 'open') score += 8;
    else if (systemType === 'semi-open') score += 4;
  } else if (typesettingAnswer === 'basic') {
    if (systemType === 'closed') score += 8;
  } else if (typesettingAnswer === 'vertical') {
    if (device.verticalText === 'excellent') score += 20;
    else if (device.verticalText === 'good') score += 10;
    else if (device.verticalText === 'poor') score -= 15;
    if (device.brand === '亞馬遜 Kindle') score -= 10;
  }

  return score;
}

// ========== 主推薦函數 ==========
export function calculateRecommendation(devices, rules, answers) {
  const scores = {};

  devices.forEach(device => {
    let total = 0;

    total += calculatePlatformScore(device, answers);
    total += calculateBudgetScore(device, answers);
    total += calculateHardwareScore(device, answers);
    total += calculatePriorityScore(device, answers);
    total += calculateLocalizationScore(device, answers);
    total += calculateTypesettingScore(device, answers);

    scores[device.id] = total;
  });

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

  const topThree = sorted.slice(0, 3).map(([id]) => devices.find(d => d.id === id));

  return {
    primary: topThree[0],
    alternatives: topThree.slice(1, 3)
  };
}

// ========== 推薦理由生成 ==========
export function getReasonText(device, answers) {
  const reasons = [];
  const usageAnswers = answers.usage || [];
  const contentAnswers = answers.content || [];
  const platformAnswers = answers.platform || [];
  const priorities = answers.priority || [];
  const systemType = getSystemType(device);
  const isColor = device.displayType.includes('彩色');

  // 系統類型理由
  const needsOpen = platformAnswers.includes('multi') || platformAnswers.includes('library') || platformAnswers.includes('webnovel') || platformAnswers.includes('browse');
  const needsClosed = platformAnswers.includes('single') && platformAnswers.length === 1;

  if (systemType === 'closed' && (needsClosed || priorities.includes('easy'))) {
    reasons.push('封閉式系統，操作直覺簡單');
  } else if (systemType === 'open' && (needsOpen || priorities.includes('flexible'))) {
    if (platformAnswers.length >= 3) {
      reasons.push('開放式系統，多種書源一台搞定');
    } else {
      reasons.push('開放式系統，可安裝多種 APP');
    }
  } else if (systemType === 'semi-open' && needsOpen) {
    reasons.push('半開放系統，內建書城並可透過 APK 安裝多種閱讀 APP');
  }

  // 螢幕尺寸 × 情境
  if (device.screenSize <= 6.5 && usageAnswers.includes('commute')) {
    reasons.push(`${device.screenSize} 吋輕巧設計，適合通勤攜帶`);
  } else if (device.screenSize >= 10 && (contentAnswers.includes('pdf') || contentAnswers.includes('magazine'))) {
    reasons.push(`${device.screenSize} 吋大螢幕，適合閱讀 PDF 和雜誌`);
  } else if (device.screenSize <= 6.5 && priorities.includes('light')) {
    reasons.push(`${device.screenSize} 吋輕巧好攜帶`);
  }

  // 螢幕類型 × 內容
  if (isColor && (contentAnswers.includes('manga-color') || contentAnswers.includes('magazine'))) {
    reasons.push('彩色螢幕，適合看彩漫和繪本');
  } else if (!isColor && contentAnswers.includes('novel') && !contentAnswers.includes('manga-color')) {
    reasons.push('黑白螢幕，文字閱讀體驗最佳');
  }

  if (contentAnswers.includes('novel') && contentAnswers.includes('manga-bw') && device.screenSize >= 7 && device.screenSize <= 8) {
    reasons.push('7-8 吋中型螢幕，小說漫畫都合適');
  }

  // 排版彈性
  if (answers.typesetting === 'flexible' && device.customFont) {
    reasons.push('排版彈性高，可自訂字體、行距與邊距');
  }
  if (answers.typesetting === 'vertical') {
    if (device.verticalText === 'excellent') {
      reasons.push('直排顯示優秀，標點引號排版正確');
    } else if (device.verticalText === 'good') {
      reasons.push('直排閱讀支援良好');
    }
  }

  if (contentAnswers.includes('manga-bw') && device.verticalText === 'excellent') {
    reasons.push('日漫對話直排顯示優秀');
  }

  // 優先功能對應
  if (priorities.includes('taiwan') && (device.brand === '讀墨 Readmoo' || device.brand === '凌網 HyRead')) {
    reasons.push('台灣品牌，在地服務支援');
  }
  if (device.hasPhysicalButtons && priorities.includes('buttons')) {
    reasons.push('實體翻頁鍵，操作更直覺');
  }
  if (device.stylus && priorities.includes('pen')) {
    reasons.push('支援手寫筆，可直接在書上劃記');
  }

  // 圖書館借閱
  if (platformAnswers.includes('library') && device.library) {
    if (device.brand === '凌網 HyRead') {
      reasons.push('原生支援圖書館借閱，體驗最佳');
    } else if (systemType === 'semi-open') {
      reasons.push('可透過安裝 APK 使用圖書館借閱服務');
    } else {
      reasons.push('支援圖書館借閱');
    }
  }

  // 預算符合
  if (answers.budget && answers.budget !== 'flexible') {
    const threshold = BUDGET_THRESHOLDS[answers.budget];
    if (threshold && device.price <= threshold) {
      const budgetLabels = {
        'low': '7,000 元以下',
        'mid': '12,000 元以下',
        'high': '18,000 元以下'
      };
      reasons.push(`價格落在你的預算範圍（${budgetLabels[answers.budget]}）`);
    }
  }

  // 補足理由（至少 2 條）
  if (reasons.length < 2) {
    if (device.library && !reasons.some(r => r.includes('圖書館'))) reasons.push('支援圖書館借閱');
    if (device.stylus && !reasons.some(r => r.includes('筆'))) reasons.push('支援手寫筆記');
    if (device.waterproof && !reasons.some(r => r.includes('防水'))) reasons.push('具備防水功能');
    if (device.hasPhysicalButtons && !reasons.some(r => r.includes('按鍵'))) reasons.push('配備實體翻頁鍵');
  }

  // 去重後取前 4 條
  const unique = [...new Set(reasons)];
  return unique.slice(0, 4);
}

// ========== 相關提示 ==========
export function getRelevantTip(tips, answers) {
  const tipList = [];
  const contentAnswers = answers.content || [];
  const platformAnswers = answers.platform || [];

  if (platformAnswers.includes('library')) {
    tipList.push(tips.library);
  }

  if (contentAnswers.includes('manga-color') || contentAnswers.includes('magazine')) {
    tipList.push(tips['color-display']);
  }

  if (answers.typesetting === 'vertical') {
    tipList.push(tips['vertical-text']);
  }

  if (answers.typesetting === 'flexible') {
    tipList.push(tips['typesetting-flexible']);
  }

  if (contentAnswers.includes('manga-bw')) {
    tipList.push(tips['vertical-text']);
  }

  tipList.push(tips['try-first']);

  return tipList.find(t => t) || null;
}
