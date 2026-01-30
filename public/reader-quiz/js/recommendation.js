/**
 * recommendation.js - 推薦邏輯
 */

export function calculateRecommendation(devices, rules, answers) {
  const scores = {};
  
  // 初始化分數
  devices.forEach(device => {
    scores[device.id] = 0;
  });
  
  // 平台偏好 → 系統類型
  const platformAnswer = answers.platform;
  devices.forEach(device => {
    if (platformAnswer === 'single') {
      if (device.system === 'closed') scores[device.id] += 15;
    } else if (platformAnswer === 'multi' || platformAnswer === 'webnovel') {
      if (device.system === 'open') scores[device.id] += 20;
    } else if (platformAnswer === 'library') {
      if (device.system === 'open') scores[device.id] += 25;
      if (device.brand === 'HyRead') scores[device.id] += 10;
    } else if (platformAnswer === 'undecided') {
      if (device.system === 'open') scores[device.id] += 5;
    }
  });
  
  // 內容類型 → 螢幕尺寸和顏色
  const contentAnswer = answers.content;
  devices.forEach(device => {
    const size = device.screen.size;
    const isColor = device.screen.type === 'color';
    
    if (contentAnswer === 'novel') {
      if (size <= 7) scores[device.id] += 15;
      if (!isColor) scores[device.id] += 5;
    } else if (contentAnswer === 'manga-bw') {
      if (size >= 7 && size <= 8) scores[device.id] += 15;
      if (!isColor) scores[device.id] += 5;
    } else if (contentAnswer === 'manga-color') {
      if (size >= 7.8) scores[device.id] += 10;
      if (isColor) scores[device.id] += 20;
    } else if (contentAnswer === 'pdf' || contentAnswer === 'magazine') {
      if (size >= 10) scores[device.id] += 20;
      if (contentAnswer === 'magazine' && isColor) scores[device.id] += 10;
    }
  });
  
  // 使用情境（複選）
  const usageAnswers = answers.usage || [];
  devices.forEach(device => {
    if (usageAnswers.includes('commute')) {
      if (device.weight <= 200) scores[device.id] += 15;
      if (device.screen.size <= 7) scores[device.id] += 10;
    }
    if (usageAnswers.includes('home')) {
      // 在家定點，大螢幕加分
      if (device.screen.size >= 7.8) scores[device.id] += 5;
    }
    if (usageAnswers.includes('bedtime')) {
      // 睡前閱讀，需要前光
      if (device.features.some(f => f.includes('前光') || f.includes('ComfortLight') || f.includes('色調'))) {
        scores[device.id] += 15;
      }
      // 無前光扣分
      if (device.features.some(f => f.includes('無前光'))) {
        scores[device.id] -= 10;
      }
    }
    if (usageAnswers.includes('work')) {
      if (device.features.some(f => f.includes('手寫') || f.includes('筆'))) {
        scores[device.id] += 20;
      }
      if (device.screen.size >= 8) scores[device.id] += 10;
    }
  });
  
  // 預算
  const budgetAnswer = answers.budget;
  const budgetRange = rules.budgetRange[budgetAnswer];
  devices.forEach(device => {
    if (device.price >= budgetRange.min && device.price <= budgetRange.max) {
      scores[device.id] += 20;
    } else if (device.price < budgetRange.min) {
      scores[device.id] += 10;
    }
  });
  
  // 字體自由度評估
  const fontAnswer = answers.font;
  devices.forEach(device => {
    if (fontAnswer === 'custom') {
      // 想自訂字體 → 優先開放式系統
      if (device.fontSupport === 'full') scores[device.id] += 20;
      if (device.system === 'open') scores[device.id] += 10;
    } else if (fontAnswer === 'default') {
      // 內建就好 → 封閉系統穩定
      if (device.system === 'closed') scores[device.id] += 10;
    } else if (fontAnswer === 'vertical') {
      // 需要直排優化
      if (device.verticalText === 'excellent') scores[device.id] += 25;
      else if (device.verticalText === 'good') scores[device.id] += 15;
      else if (device.verticalText === 'poor') scores[device.id] -= 15;
      // Kindle 直排差，額外扣分
      if (device.brand === 'Amazon') scores[device.id] -= 10;
    }
  });
  
  // 優先特點
  const priorities = answers.priority || [];
  devices.forEach(device => {
    if (priorities.includes('easy') && device.system === 'closed') {
      scores[device.id] += 15;
    }
    if (priorities.includes('flexible') && device.system === 'open') {
      scores[device.id] += 15;
    }
    if (priorities.includes('taiwan') && device.origin === '台灣品牌') {
      scores[device.id] += 20;
    }
    if (priorities.includes('light') && device.weight <= 200) {
      scores[device.id] += 15;
    }
    if (priorities.includes('waterproof') && device.waterproof) {
      scores[device.id] += 20;
    }
    if (priorities.includes('pen') && device.features.some(f => f.includes('手寫') || f.includes('筆'))) {
      scores[device.id] += 20;
    }
  });
  
  // 按分數排序
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
  
  if (device.system === 'closed' && (answers.platform === 'single' || answers.priority?.includes('easy'))) {
    reasons.push('封閉式系統，操作直覺簡單');
  } else if (device.system === 'open' && (answers.platform === 'multi' || answers.platform === 'library' || answers.priority?.includes('flexible'))) {
    reasons.push('開放式系統，可安裝多種 APP');
  }
  
  if (device.screen.size <= 6.5 && usageAnswers.includes('commute')) {
    reasons.push(`${device.screen.size} 吋輕巧設計，適合通勤攜帶`);
  } else if (device.screen.size >= 10 && (answers.content === 'pdf' || answers.content === 'magazine')) {
    reasons.push(`${device.screen.size} 吋大螢幕，適合閱讀 PDF 和雜誌`);
  }
  
  if (device.screen.type === 'color' && (answers.content === 'manga-color' || answers.content === 'magazine')) {
    reasons.push('彩色螢幕，適合看彩漫和繪本');
  } else if (device.screen.type === 'black-white' && answers.content === 'novel') {
    reasons.push('黑白螢幕，文字閱讀體驗最佳');
  }
  
  // 字體相關理由
  if (answers.font === 'custom' && device.fontSupport === 'full') {
    reasons.push('支援安裝自訂字體，閱讀體驗可完全客製');
  }
  if (answers.font === 'vertical' && device.verticalText === 'excellent') {
    reasons.push('直排閱讀優化出色，適合日文與繁中書籍');
  }
  
  if (device.origin === '台灣品牌' && answers.priority?.includes('taiwan')) {
    reasons.push('台灣品牌，在地服務支援');
  }
  
  if (device.waterproof && answers.priority?.includes('waterproof')) {
    reasons.push('IPX8 防水，可在浴室安心使用');
  }
  
  if (device.weight <= 180 && answers.priority?.includes('light')) {
    reasons.push(`僅 ${device.weight}g，輕巧好攜帶`);
  }
  
  if (device.platform) {
    reasons.push(`整合 ${device.platform}，購書方便`);
  }
  
  // 補足理由
  if (reasons.length < 3) {
    device.pros.forEach(pro => {
      if (reasons.length < 4 && !reasons.some(r => r.includes(pro))) {
        reasons.push(pro);
      }
    });
  }
  
  return reasons.slice(0, 4);
}

export function getRelevantTip(tips, answers) {
  const tipList = [];
  
  if (answers.platform === 'library') {
    tipList.push(tips.library);
  }
  
  if (answers.content === 'manga-color' || answers.content === 'magazine') {
    tipList.push(tips['color-display']);
  }
  
  // 字體相關提示
  if (answers.font === 'vertical') {
    tipList.push(tips['vertical-text']);
  }
  
  tipList.push(tips['try-first']);
  
  return tipList[0];
}
