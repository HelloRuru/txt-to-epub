/**
 * render.js - UI 渲染
 * 匹配 main.js 的 import 介面
 */

import { icons } from './icons.js';

function icon(name) {
  return icons[name] || '';
}

// ========== renderQuiz ==========
export function renderQuiz(app, quizData, currentQuestion, answers, callbacks) {
  const { onSelect, onNext, onPrev } = callbacks;
  const question = quizData.questions[currentQuestion];
  const total = quizData.questions.length;
  const progress = ((currentQuestion + 1) / total) * 100;
  const isMultiple = question.multiple === true;
  const currentAnswer = answers[question.id];
  const hasAnswer = isMultiple
    ? (Array.isArray(currentAnswer) && currentAnswer.length > 0)
    : (currentAnswer !== undefined && currentAnswer !== null);

  app.innerHTML = `
    <header class="header">
      <div class="header__logo">${icon('book')}</div>
      <h1 class="header__title">${quizData.meta?.title || '電子書閱讀器選購測驗'}</h1>
      <p class="header__subtitle">${quizData.meta?.subtitle || '找到最適合你的閱讀器'}</p>
    </header>

    <div class="progress">
      <div class="progress__bar">
        <div class="progress__fill" style="width: ${progress}%"></div>
      </div>
      <p class="progress__text">第 ${currentQuestion + 1} / ${total} 題</p>
    </div>

    <div class="quiz fade-in">
      <div class="question">
        <h2 class="question__title">${question.question}</h2>
        ${question.description ? `<p class="question__desc">${question.description}</p>` : ''}
        ${isMultiple ? '<p class="question__hint">可複選</p>' : ''}
      </div>

      <div class="options">
        ${question.options.map(opt => {
          const selected = isMultiple
            ? (Array.isArray(currentAnswer) && currentAnswer.includes(opt.id))
            : (currentAnswer === opt.id);
          return `
            <button class="option${selected ? ' selected' : ''}" data-qid="${question.id}" data-oid="${opt.id}" data-multiple="${isMultiple}">
              <div class="option__icon">${icon(opt.icon)}</div>
              <div class="option__content">
                <div class="option__text">${opt.text}</div>
                ${opt.description ? `<div class="option__desc">${opt.description}</div>` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <div class="nav">
        <button class="btn btn--secondary" ${currentQuestion === 0 ? 'disabled' : ''} data-action="prev">上一題</button>
        <button class="btn btn--primary" ${!hasAnswer ? 'disabled' : ''} data-action="next">
          ${currentQuestion === total - 1 ? '查看推薦' : '下一題'}
        </button>
      </div>
    </div>
  `;

  // 綁定事件
  app.querySelectorAll('.option').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.qid;
      const oid = btn.dataset.oid;
      const multi = btn.dataset.multiple === 'true';
      onSelect(qid, oid, multi);

      // 單選時自動啟用下一題按鈕
      if (!multi) {
        const nextBtn = app.querySelector('[data-action="next"]');
        if (nextBtn) nextBtn.disabled = false;
      }
    });
  });

  const prevBtn = app.querySelector('[data-action="prev"]');
  const nextBtn = app.querySelector('[data-action="next"]');
  if (prevBtn) prevBtn.addEventListener('click', onPrev);
  if (nextBtn) nextBtn.addEventListener('click', () => {
    // 重新檢查是否有答案
    const ca = answers[question.id];
    const ha = isMultiple
      ? (Array.isArray(ca) && ca.length > 0)
      : (ca !== undefined && ca !== null);
    if (ha) onNext();
  });
}

// ========== updateOptionUI ==========
export function updateOptionUI(app, questionId, answers, isMultiple) {
  const currentAnswer = answers[questionId];

  app.querySelectorAll('.option').forEach(btn => {
    if (btn.dataset.qid !== questionId) return;
    const oid = btn.dataset.oid;
    const selected = isMultiple
      ? (Array.isArray(currentAnswer) && currentAnswer.includes(oid))
      : (currentAnswer === oid);

    if (selected) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });

  // 更新按鈕狀態
  const hasAnswer = isMultiple
    ? (Array.isArray(currentAnswer) && currentAnswer.length > 0)
    : (currentAnswer !== undefined && currentAnswer !== null);
  const nextBtn = app.querySelector('[data-action="next"]');
  if (nextBtn) nextBtn.disabled = !hasAnswer;
}

// ========== renderResult ==========
export function renderResult(app, quizData, recommendation, reasons, tip, callbacks) {
  const { onRestart } = callbacks;
  const device = recommendation.primary;
  const alts = recommendation.alternatives || [];

  // 裝置規格標籤
  function deviceTags(d) {
    const tags = [];
    if (d.displayType) tags.push(d.displayType);
    if (d.screenSize) tags.push(`${d.screenSize} 吋`);
    if (d.storage) tags.push(d.storage);
    if (d.waterproof) tags.push('防水');
    if (d.stylus) tags.push('手寫筆');
    if (d.hasPhysicalButtons) tags.push('實體按鍵');
    if (d.openSystem) tags.push('開放系統');
    if (d.library) tags.push('圖書館借閱');
    if (d.customFont) tags.push('自訂字體');
    return tags;
  }

  const tags = deviceTags(device);

  app.innerHTML = `
    <header class="header">
      <div class="header__logo">${icon('trophy')}</div>
      <h1 class="header__title">推薦結果</h1>
      <p class="header__subtitle">根據你的回答，以下是最適合的選擇</p>
    </header>

    <div class="result fade-in">
      <div class="result__header">
        <span class="result__badge">${icon('star')} 最佳推薦</span>
      </div>

      <div class="recommendation">
        <div class="recommendation__image">
          ${icon('tablet')}
        </div>
        <div class="recommendation__body">
          <p class="recommendation__brand">${device.brand}</p>
          <h2 class="recommendation__name">${device.name}</h2>
          <p class="recommendation__price">NT$ ${device.price.toLocaleString()}</p>

          <div class="recommendation__tags">
            ${tags.map((t, i) => `<span class="tag${i % 2 === 1 ? ' tag--secondary' : ''}">${t}</span>`).join('')}
          </div>

          <div class="specs">
            <div class="spec">
              <div class="spec__icon">${icon('monitor')}</div>
              <div>
                <div class="spec__label">螢幕</div>
                <div class="spec__value">${device.screenSize} 吋 ${device.displayType}</div>
              </div>
            </div>
            <div class="spec">
              <div class="spec__icon">${icon('layers')}</div>
              <div>
                <div class="spec__label">容量</div>
                <div class="spec__value">${device.storage}</div>
              </div>
            </div>
            <div class="spec">
              <div class="spec__icon">${icon('droplet')}</div>
              <div>
                <div class="spec__label">防水</div>
                <div class="spec__value">${device.waterproof ? '支援' : '無'}</div>
              </div>
            </div>
            <div class="spec">
              <div class="spec__icon">${icon('type')}</div>
              <div>
                <div class="spec__label">直排支援</div>
                <div class="spec__value">${device.verticalText === 'excellent' ? '優秀' : device.verticalText === 'good' ? '良好' : '較差'}</div>
              </div>
            </div>
          </div>

          ${reasons && reasons.length > 0 ? `
            <div class="reasons">
              <h3 class="reasons__title">${icon('star')} 推薦理由</h3>
              <ul class="reasons__list">
                ${reasons.map(r => `<li class="reasons__item">${icon('check')} ${r}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${device.url ? `
            <a href="${device.url}" target="_blank" rel="noopener noreferrer" class="btn btn--primary btn--full btn--buy">
              前往官網了解更多 ${icon('external-link')}
            </a>
          ` : ''}
        </div>
      </div>

      ${alts.length > 0 ? `
        <div class="alternatives">
          <h3 class="alternatives__title">其他推薦</h3>
          ${alts.map(alt => `
            <a href="${alt.url || '#'}" target="_blank" rel="noopener noreferrer" class="alt-card${alt.url ? ' alt-card--clickable' : ''}">
              <div class="alt-card__icon">${icon('tablet')}</div>
              <div class="alt-card__content">
                <div class="alt-card__name">${alt.name}</div>
                <div class="alt-card__note">${alt.brand} · ${alt.screenSize} 吋 ${alt.displayType}</div>
              </div>
              <div class="alt-card__price">NT$ ${alt.price.toLocaleString()}</div>
              ${alt.url ? `<div class="alt-card__link">${icon('external-link')}</div>` : ''}
            </a>
          `).join('')}
        </div>
      ` : ''}

      <div class="disclaimer">
        <p class="disclaimer__text">${icon('info')} 本測驗價格與規格資料以 2026 年 2 月 3 日為基準，實際售價可能因通路、促銷活動或產品改版而異，購買前請以各品牌官網或銷售平台公告為準。</p>
      </div>

      ${tip ? `
        <div class="tips">
          <h3 class="tips__title">${icon('lightbulb')} ${tip.title}</h3>
          <p class="tips__content">${tip.content}</p>
        </div>
      ` : ''}

      <div class="actions">
        <button class="btn btn--secondary btn--full" data-action="restart">
          ${icon('refresh')} 重新測驗
        </button>
      </div>
    </div>

    <div class="footer">
      <div class="footer__credit">
        <p class="footer__credit-title">本測驗內容參考自</p>
        <p class="footer__credit-name"><a href="https://home.gamer.com.tw/artwork.php?sn=6140260" target="_blank" rel="noopener">DiDaDi 的電子書閱讀器選購指南</a></p>
        <p class="footer__credit-thanks">感謝 Di 提供專業且詳盡的閱讀器知識整理</p>
      </div>
      <p class="footer__copyright">&copy; ${new Date().getFullYear()} Kaoru Tsai. All Rights Reserved. | <a href="mailto:hello@helloruru.com">hello@helloruru.com</a></p>
    </div>
  `;

  const restartBtn = app.querySelector('[data-action="restart"]');
  if (restartBtn) restartBtn.addEventListener('click', onRestart);
}

// ========== renderError ==========
export function renderError(app) {
  app.innerHTML = `
    <div class="error">
      ${icon('alert-circle')}
      <h2>載入失敗</h2>
      <p>很抱歉，測驗資料載入時發生錯誤。</p>
      <button onclick="location.reload()">重新整理</button>
    </div>
  `;
}
