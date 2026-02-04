/**
 * recommendation.js - 推薦邏輯
 * 屬性名對齊 devices.json 扁平結構
 */

export function calculateRecommendation(devices, rules, answers) {
  const scores = {};

  devices.forEach(device => {
    scores[device.id] = 0;
  });

  // 平台偏好 → 系統類型（複選）
  const platformAnswers = answers.platform || [];
  devices.forEach(device => {
    const isOpen = device.openSystem;

    const sourceCount = platformAnswers.length;
    const diversityBonus = sourceCount >= 3 ? 10 : sourceCount >= 2 ? 5 : 0;

    if (platformAnswers.includes('single')) {
      if (!isOpen) scores[device.id] += 15;
    }
    if (platformAnswers.includes('multi')) {
      if (isOpen) scores[device.id] += 20;
    }
    if (platformAnswers.includes('library')) {
      if (isOpen) scores[device.id] += 25;
      if (device.brand === 'HyRead') scores[device.id] += 10;
    }
    if (platformAnswers.includes('webnovel')) {
      if (isOpen) scores[device.id] += 20;
    }
    if (platformAnswers.includes('browse')) {
      if (isOpen) scores[device.id] += 20;
    }
    if (platformAnswers.includes('undecided')) {
      if (isOpen) scores[device.id] += 5;
    }

    if (isOpen) scores[device.id] += diversityBonus;

    if (platformAnswers.includes('single') && sourceCount > 1 && isOpen) {
      scores[device.id] += 8;
    }
  });

  // 內容類型（複選）
  const contentAnswers = answers.content || [];
  devices.forEach(device => {
    const size = device.screenSize;
    const isColor = device.displayType.includes('彩色');

    if (contentAnswers.includes('novel')) {
      if (size <= 7) scores[device.id] += 10;
      if (!isColor) scores[device.id] += 3;
    }

    if (contentAnswers.includes('manga-bw')) {
      if (size >= 7 && size <= 8) scores[device.id] += 10;
      if (!isColor) scores[device.id] += 3;
      if (device.verticalText === 'excellent') scores[device.id] += 8;
      else if (device.verticalText === 'good') scores[device.id] += 4;
      else if (device.verticalText === 'poor') scores[device.id] -= 8;
    }

    if (contentAnswers.includes('manga-color')) {
      if (size >= 7.8) scores[device.id] += 8;
      if (isColor) scores[device.id] += 15;
    }

    if (contentAnswers.includes('pdf')) {
      if (size >= 10) scores[device.id] += 15;
    }

    if (contentAnswers.includes('magazine')) {
      if (size >= 10) scores[device.id] += 12;
      if (isColor) scores[device.id] += 8;
    }

    if (contentAnswers.includes('novel') && (contentAnswers.includes('manga-bw') || contentAnswers.includes('manga-color'))) {
      if (size >= 7 && size <= 8) scores[device.id] += 5;
    }

    if (contentAnswers.includes('manga-bw') && contentAnswers.includes('manga-color')) {
      if (isColor) scores[device.id] += 5;
    }
  });

  // 使用情境（複選）
  const usageAnswers = answers.usage || [];
  devices.forEach(device => {
    if (usageAnswers.includes('commute')) {
      if (device.screenSize <= 7) scores[device.id] += 15;
    }
    if (usageAnswers.includes('home')) {
      if (device.screenSize >= 7.8) scores[device.id] += 5;
    }
    if (usageAnswers.includes('bedtime')) {
      scores[device.id] += 5;
    }
    if (usageAnswers.includes('work')) {
      if (device.stylus) scores[device.id] += 20;
      if (device.screenSize >= 8) scores[device.id] += 10;
    }
  });

  // 預算
  const budgetAnswer = answers.budget;
  const budgetRange = rules.budgetRange[budgetAnswer];
  if (budgetRange) {
    devices.forEach(device => {
      if (device.price >= budgetRange.min && device.price <= budgetRange.max) {
        scores[device.id] += 20;
      } else if (device.price < budgetRange.min) {
        scores[device.id] += 10;
      }
    });
  }

  // 排版彈性需求
  const typesettingAnswer = answers.typesetting;
  devices.forEach(device => {
    if (typesettingAnswer === 'flexible') {
      if (device.customFont) scores[device.id] += 20;
      if (device.openSystem) scores[device.id] += 10;
      if (device.verticalText === 'excellent') scores[device.id] += 5;
    } else if (typesettingAnswer === 'basic') {
      if (!device.openSystem) scores[device.id] += 10;
    } else if (typesettingAnswer === 'vertical') {
      if (device.verticalText === 'excellent') scores[device.id] += 30;
      else if (device.verticalText === 'good') scores[device.id] += 15;
      else if (device.verticalText === 'poor') scores[device.id] -= 20;
      if (device.customFont) scores[device.id] += 5;
      if (device.brand === 'Amazon') scores[device.id] -= 15;
    }
  });

  // 優先特點
  const priorities = answers.priority || [];
  devices.forEach(device => {
    if (priorities.includes('easy') && !device.openSystem) {
      scores[device.id] += 15;
    }
    if (priorities.includes('flexible') && device.openSystem) {
      scores[device.id] += 15;
    }
    if (priorities.includes('taiwan')) {
      if (device.brand === 'Readmoo 讀墨' || device.brand === 'HyRead') {
        scores[device.id] += 20;
      }
    }
    if (priorities.includes('light') && device.screenSize <= 6.5) {
      scores[device.id] += 15;
    }
    if (priorities.includes('waterproof') && device.waterproof) {
      scores[device.id] += 20;
    }
    if (priorities.includes('buttons') && device.hasPhysicalButtons) {
      scores[device.id] += 15;
    }
    if (priorities.includes('pen') && device.stylus) {
      scores[device.id] += 20;
    }
  });

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

  const topThree = sorted.slice(0, 3).map(([id]) => devices.find(d => d.id === id));

  return {
    primary: topThree[0],
    alternatives: topThree.slice(1, 3)
  };
}

export function getReasonText(device, answers) {
  const reasons = [];
  const usageAnswers = answers.usage || [];
  const contentAnswers = answers.content || [];
  const platformAnswers = answers.platform || [];
  const priorities = answers.priority || [];
  const isOpen = device.openSystem;
  const isColor = device.displayType.includes('彩色');

  // 平台相關理由
  const needsOpen = platformAnswers.includes('multi') || platformAnswers.includes('library') || platformAnswers.includes('webnovel') || platformAnswers.includes('browse');
  const needsClosed = platformAnswers.includes('single') && platformAnswers.length === 1;

  if (!isOpen && (needsClosed || priorities.includes('easy'))) {
    reasons.push('封閉式系統，操作直覺簡單');
  } else if (isOpen && (needsOpen || priorities.includes('flexible'))) {
    if (platformAnswers.length >= 3) {
      reasons.push('開放式系統，多種書源一台搞定');
    } else {
      reasons.push('開放式系統，可安裝多種 APP');
    }
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
  if (priorities.includes('taiwan') && (device.brand === 'Readmoo 讀墨' || device.brand === 'HyRead')) {
    reasons.push('台灣品牌，在地服務支援');
  }
  if (device.waterproof && priorities.includes('waterproof')) {
    reasons.push('IPX8 防水，可在浴室安心使用');
  }
  if (device.hasPhysicalButtons && priorities.includes('buttons')) {
    reasons.push('實體翻頁鍵，操作更直覺');
  }
  if (device.stylus && priorities.includes('pen')) {
    reasons.push('支援手寫筆，可直接在書上劃記');
  }

  // 圖書館借閱
  if (platformAnswers.includes('library') && device.library) {
    reasons.push('支援圖書館借閱');
  }

  // 預算符合
  if (answers.budget) {
    const budgetLabels = {
      'under-5k': '5,000 元以下',
      '5k-8k': '5,000–8,000 元',
      '8k-12k': '8,000–12,000 元',
      'over-12k': '12,000 元以上'
    };
    const label = budgetLabels[answers.budget];
    if (label) {
      reasons.push(`價格落在你的預算範圍（${label}）`);
    }
  }

  // 補足理由（至少 2 條）
  if (reasons.length < 2) {
    if (device.library && !reasons.some(r => r.includes('圖書館'))) reasons.push('支援圖書館借閱');
    if (device.stylus && !reasons.some(r => r.includes('筆'))) reasons.push('支援手寫筆記');
    if (device.waterproof && !reasons.some(r => r.includes('防水'))) reasons.push('具備防水功能');
  }

  // 去重後取前 4 條
  const unique = [...new Set(reasons)];
  return unique.slice(0, 4);
}

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
