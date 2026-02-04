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

    // 選越多來源 → 越需要開放系統
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

    // 多來源多元性加分（只給開放系統）
    if (isOpen) scores[device.id] += diversityBonus;

    // 若同時選了 single + 其他來源 → 開放系統仍有優勢
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

  // 字體自由度
  const fontAnswer = answers.font;
  devices.forEach(device => {
    if (fontAnswer === 'custom') {
      if (device.customFont) scores[device.id] += 20;
      if (device.openSystem) scores[device.id] += 10;
    } else if (fontAnswer === 'default') {
      if (!device.openSystem) scores[device.id] += 10;
    } else if (fontAnswer === 'vertical') {
      if (device.verticalText === 'excellent') scores[device.id] += 30;
      else if (device.verticalText === 'good') scores[device.id] += 15;
      else if (device.verticalText === 'poor') scores[device.id] -= 20;
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
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => devices.find(d => d.id === id));

  return {
    primary: sorted[0],
    alternatives: sorted.slice(1, 3)
  };
}

export function getReasonText(device, answers) {
  const reasons = [];
  const usageAnswers = answers.usage || [];
  const contentAnswers = answers.content || [];
  const platformAnswers = answers.platform || [];
  const isOpen = device.openSystem;
  const isColor = device.displayType.includes('彩色');

  // 平台相關理由（改為陣列判斷）
  const needsOpen = platformAnswers.includes('multi') || platformAnswers.includes('library') || platformAnswers.includes('webnovel') || platformAnswers.includes('browse');
  const needsClosed = platformAnswers.includes('single') && platformAnswers.length === 1;

  if (!isOpen && (needsClosed || answers.priority?.includes('easy'))) {
    reasons.push('封閉式系統，操作直覺簡單');
  } else if (isOpen && (needsOpen || answers.priority?.includes('flexible'))) {
    if (platformAnswers.length >= 3) {
      reasons.push('開放式系統，多種書源一台搞定');
    } else {
      reasons.push('開放式系統，可安裝多種 APP');
    }
  }

  if (device.screenSize <= 6.5 && usageAnswers.includes('commute')) {
    reasons.push(`${device.screenSize} 吋輕巧設計，適合通勤攜帶`);
  } else if (device.screenSize >= 10 && (contentAnswers.includes('pdf') || contentAnswers.includes('magazine'))) {
    reasons.push(`${device.screenSize} 吋大螢幕，適合閱讀 PDF 和雜誌`);
  }

  if (isColor && (contentAnswers.includes('manga-color') || contentAnswers.includes('magazine'))) {
    reasons.push('彩色螢幕，適合看彩漫和繪本');
  } else if (!isColor && contentAnswers.includes('novel') && !contentAnswers.includes('manga-color')) {
    reasons.push('黑白螢幕，文字閱讀體驗最佳');
  }

  if (contentAnswers.includes('novel') && contentAnswers.includes('manga-bw') && device.screenSize >= 7 && device.screenSize <= 8) {
    reasons.push('7-8 吋中型螢幕，小說漫畫都合適');
  }

  if (answers.font === 'custom' && device.customFont) {
    reasons.push('支援安裝自訂字體，閱讀體驗可完全客製');
  }
  if (answers.font === 'vertical' && device.verticalText === 'excellent') {
    reasons.push('直排顯示優秀，適合日文小說與繁中直排書');
  } else if (answers.font === 'vertical' && device.verticalText === 'good') {
    reasons.push('直排閱讀支援良好');
  }

  if (contentAnswers.includes('manga-bw') && device.verticalText === 'excellent') {
    reasons.push('日漫對話直排顯示優秀');
  }

  if (answers.priority?.includes('taiwan') && (device.brand === 'Readmoo 讀墨' || device.brand === 'HyRead')) {
    reasons.push('台灣品牌，在地服務支援');
  }

  if (device.waterproof && answers.priority?.includes('waterproof')) {
    reasons.push('IPX8 防水，可在浴室安心使用');
  }

  if (device.hasPhysicalButtons && answers.priority?.includes('buttons')) {
    reasons.push('實體翻頁鍵，操作更直覺');
  }

  // 圖書館借閱理由
  if (platformAnswers.includes('library') && device.library) {
    reasons.push('支援圖書館借閱');
  }

  // 補足理由
  if (reasons.length < 3) {
    if (device.library && !reasons.some(r => r.includes('圖書館'))) reasons.push('支援圖書館借閱');
    if (device.stylus && !reasons.some(r => r.includes('筆'))) reasons.push('支援手寫筆記');
    if (device.waterproof && !reasons.some(r => r.includes('防水'))) reasons.push('具備防水功能');
  }

  return reasons.slice(0, 4);
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

  if (answers.font === 'vertical') {
    tipList.push(tips['vertical-text']);
  }

  if (answers.font === 'custom') {
    tipList.push(tips['font-custom']);
  }

  if (contentAnswers.includes('manga-bw')) {
    tipList.push(tips['vertical-text']);
  }

  tipList.push(tips['try-first']);

  return tipList.find(t => t) || null;
}
