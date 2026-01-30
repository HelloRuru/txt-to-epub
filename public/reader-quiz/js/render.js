/**
 * render.js - UI 渲染
 */

import { icons } from './icons.js';

export function renderQuiz(app, quizData, currentQuestion, answers, callbacks) {
  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const isMultiple = question.multiple || false;
  
  app.innerHTML = `
    <header class="header">
      <div class="header__logo">
        ${icons['book-open']}
      </div>
      <h1 class="header__title">電子書閱讀器選購測驗</h1>
      <p class="header__subtitle">回答幾個問題，找到最適合你的閱讀器</p>
    </header>
    
    <main class="quiz">
      <div class="progress">
        <div class="progress__bar">
          <div class="progress__fill" style="width: ${progress}%"></div>
        </div>
        <p class="progress__text">問題 ${currentQuestion + 1} / ${quizData.questions.length}</p>
      </div>
      
      <div class="question fade-in">
        <h2 class="question__title">${question.question}</h2>
        ${question.description ? `<p class="question__desc">${question.description}</p>` : ''}
        ${isMultiple ? `<p class="question__hint">可複選</p>` : ''}
        
        <div class="options">
          ${question.options.map(opt => `
            <button class="option" data-question="${question.id}" data-option="${opt.id}" data-multiple="${isMultiple}">
              <div class="option__icon">
                ${icons[opt.icon] || icons['check-circle']}
              </div>
              <div class="option__content">
                <p class="option__text">${opt.text}</p>
                ${opt.description ? `<p class="option__desc">${opt.description}</p>` : ''}
              </div>
            </button>
          `).join('')}
        </div>
      </div>
      
      <div class="nav">
        <button class="btn btn--secondary" id="prevBtn" ${currentQuestion === 0 ? 'disabled' : ''}>
          ${icons['arrow-left']}
          上一題
        </button>
        <button class="btn btn--primary" id="nextBtn" disabled>
          ${currentQuestion === quizData.questions.length - 1 ? '看結果' : '下一題'}
          ${icons['arrow-right']}
        </button>
      </div>
    </main>
    
    ${renderFooter(quizData.meta)}
  `;
  
  bindQuizEvents(app, question.id, isMultiple, answers, callbacks);
  restoreAnswer(app, question.id, isMultiple, answers);
  updateNextButton(app, question.id, answers);
}

function bindQuizEvents(app, questionId, isMultiple, answers, callbacks) {
  app.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', () => {
      const optionId = opt.dataset.option;
      callbacks.onSelect(questionId, optionId, isMultiple);
    });
  });
  
  app.querySelector('#prevBtn')?.addEventListener('click', callbacks.onPrev);
  app.querySelector('#nextBtn')?.addEventListener('click', callbacks.onNext);
}

function restoreAnswer(app, questionId, isMultiple, answers) {
  if (!answers[questionId]) return;
  
  app.querySelectorAll('.option').forEach(opt => {
    const optionId = opt.dataset.option;
    const selectedAnswers = answers[questionId];
    const isSelected = isMultiple 
      ? selectedAnswers.includes(optionId)
      : selectedAnswers === optionId;
    
    if (isSelected) {
      opt.classList.add('selected');
    }
  });
}

export function updateOptionUI(app, questionId, answers, isMultiple) {
  app.querySelectorAll('.option').forEach(opt => {
    const optionId = opt.dataset.option;
    if (isMultiple) {
      if (answers[questionId]?.includes(optionId)) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    } else {
      opt.classList.toggle('selected', answers[questionId] === optionId);
    }
  });
  
  updateNextButton(app, questionId, answers);
}

function updateNextButton(app, questionId, answers) {
  const btn = app.querySelector('#nextBtn');
  const hasAnswer = answers[questionId] && 
    (Array.isArray(answers[questionId]) ? answers[questionId].length > 0 : true);
  btn.disabled = !hasAnswer;
}

export function renderResult(app, quizData, recommendation, reasons, tip, callbacks) {
  const device = recommendation.primary;
  const alternatives = recommendation.alternatives;
  
  app.innerHTML = `
    <header class="header">
      <div class="header__logo">
        ${icons['check-circle']}
      </div>
      <h1 class="header__title">測驗完成！</h1>
      <p class="header__subtitle">根據你的回答，我們推薦以下閱讀器</p>
    </header>
    
    <main class="result fade-in">
      <div class="result__header">
        <span class="result__badge">
          ${icons.target}
          最佳推薦
        </span>
      </div>
      
      <div class="recommendation">
        <div class="recommendation__image">
          ${icons.monitor}
        </div>
        <div class="recommendation__body">
          <p class="recommendation__brand">${device.brand}</p>
          <h2 class="recommendation__name">${device.name}</h2>
          <p class="recommendation__price">NT$ ${device.price.toLocaleString()}</p>
          
          <div class="recommendation__tags">
            <span class="tag">${device.screen.size} 吋</span>
            <span class="tag">${device.screen.type === 'color' ? '彩色' : '黑白'}</span>
            <span class="tag tag--secondary">${device.system === 'open' ? '開放式' : '封閉式'}</span>
            ${device.waterproof ? '<span class="tag">防水</span>' : ''}
          </div>
          
          <div class="specs">
            <div class="spec">
              <div class="spec__icon">${icons.monitor}</div>
              <div class="spec__content">
                <p class="spec__label">螢幕</p>
                <p class="spec__value">${device.screen.size}" ${device.screen.ppi}PPI</p>
              </div>
            </div>
            <div class="spec">
              <div class="spec__icon">${icons.weight}</div>
              <div class="spec__content">
                <p class="spec__label">重量</p>
                <p class="spec__value">${device.weight}g</p>
              </div>
            </div>
            <div class="spec">
              <div class="spec__icon">${icons['hard-drive']}</div>
              <div class="spec__content">
                <p class="spec__label">儲存空間</p>
                <p class="spec__value">${device.storage}GB</p>
              </div>
            </div>
            <div class="spec">
              <div class="spec__icon">${icons.shield}</div>
              <div class="spec__content">
                <p class="spec__label">防水</p>
                <p class="spec__value">${device.waterproof ? '支援 IPX8' : '無'}</p>
              </div>
            </div>
          </div>
          
          <div class="reasons">
            <h3 class="reasons__title">
              ${icons.lightbulb}
              推薦理由
            </h3>
            <ul class="reasons__list">
              ${reasons.map(reason => `
                <li class="reasons__item">
                  ${icons['check-circle']}
                  ${reason}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
      
      ${alternatives.length > 0 ? `
        <div class="alternatives">
          <h3 class="alternatives__title">也可以考慮</h3>
          ${alternatives.map(alt => `
            <div class="alt-card">
              <div class="alt-card__icon">
                ${icons.monitor}
              </div>
              <div class="alt-card__content">
                <p class="alt-card__name">${alt.name}</p>
                <p class="alt-card__note">${alt.brand} · ${alt.screen.size}" ${alt.screen.type === 'color' ? '彩色' : '黑白'}</p>
              </div>
              <p class="alt-card__price">$${alt.price.toLocaleString()}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="tips">
        <h3 class="tips__title">
          ${icons.lightbulb}
          購買前提醒
        </h3>
        <p class="tips__content">${tip}</p>
      </div>
      
      <div class="actions">
        <button class="btn btn--primary btn--full" id="restartBtn">
          ${icons['refresh-cw']}
          重新測驗
        </button>
      </div>
    </main>
    
    ${renderFooter(quizData.meta)}
  `;
  
  app.querySelector('#restartBtn')?.addEventListener('click', callbacks.onRestart);
}

function renderFooter(meta) {
  const updateDate = meta?.lastUpdate || '2026.01';
  return `
    <footer class="footer">
      <div class="footer__credit">
        <p class="footer__credit-title">本測驗內容參考自</p>
        <p class="footer__credit-name">DiDaDi 的電子書閱讀器選購指南</p>
        <p class="footer__credit-thanks">感謝 Di 提供專業且詳盡的閱讀器知識整理</p>
      </div>
      <div class="footer__info">
        <p>製作：<a href="https://helloruru.com" target="_blank" rel="noopener">Hello Ruru</a></p>
        <p>最後更新：${updateDate}</p>
      </div>
    </footer>
  `;
}

export function renderError(app) {
  app.innerHTML = `
    <div class="error">
      <h2>載入失敗</h2>
      <p>無法載入測驗資料，請重新整理頁面。</p>
      <button onclick="location.reload()">重新整理</button>
    </div>
  `;
}
