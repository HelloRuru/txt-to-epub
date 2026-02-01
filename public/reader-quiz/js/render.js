// render.js - 修復 undefined bug
import { icons } from './icons.js';

export function renderQuestion(question, onSelect) {
  const container = document.getElementById('quiz-container');
  
  container.innerHTML = `
    <div class="question-card">
      <h2 class="question-title">${question.question}</h2>
      ${question.description ? `<p class="question-description">${question.description}</p>` : ''}
      <div class="options-grid">
        ${question.options.map(option => `
          <button class="option-btn" data-value="${option.id}">
            <span class="option-icon">${icons[option.icon] || icons['star']}</span>
            <span class="option-text">${option.text}</span>
            ${option.description ? `<span class="option-desc">${option.description}</span>` : ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  
  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      onSelect(btn.dataset.value);
    });
  });
}

export function renderMultiSelect(question, onSelect) {
  const container = document.getElementById('quiz-container');
  const selected = new Set();
  
  container.innerHTML = `
    <div class="question-card">
      <h2 class="question-title">${question.question}</h2>
      ${question.description ? `<p class="question-description">${question.description}</p>` : ''}
      <div class="options-grid multi-select">
        ${question.options.map(option => `
          <button class="option-btn" data-value="${option.id}">
            <span class="option-icon">${icons[option.icon] || icons['star']}</span>
            <span class="option-text">${option.text}</span>
            ${option.description ? `<span class="option-desc">${option.description}</span>` : ''}
          </button>
        `).join('')}
      </div>
      <button class="confirm-btn" disabled>確認選擇</button>
    </div>
  `;
  
  const confirmBtn = container.querySelector('.confirm-btn');
  
  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      if (selected.has(value)) {
        selected.delete(value);
        btn.classList.remove('selected');
      } else {
        selected.add(value);
        btn.classList.add('selected');
      }
      confirmBtn.disabled = selected.size === 0;
    });
  });
  
  confirmBtn.addEventListener('click', () => {
    onSelect(Array.from(selected));
  });
}

export function renderResult(result, tip) {
  const container = document.getElementById('quiz-container');
  const { primary, alternatives } = result;
  
  // 防呆：確保 icons 存在
  const externalLinkIcon = icons['external-link'] || icons['link'] || `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
  
  container.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <span class="result-icon">${icons['trophy'] || '🏆'}</span>
        <h2>推薦結果</h2>
      </div>
      
      <p class="result-disclaimer">⚠️ 本測驗僅供參考，建議購買前多方比較</p>
      
      <div class="primary-result">
        <div class="device-card primary">
          <div class="device-header">
            <span class="recommend-badge">最佳推薦</span>
            <h3 class="device-name">${primary.name}</h3>
            <p class="device-brand">${primary.brand}</p>
          </div>
          <div class="device-specs">
            <span class="spec">${primary.screenSize}" ${primary.displayType}</span>
            <span class="spec">${primary.storage}</span>
            <span class="spec">NT$ ${primary.price.toLocaleString()}</span>
          </div>
          <div class="device-reasons">
            <p class="reasons-title">推薦原因：</p>
            <ul>
              ${primary.reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
          ${primary.url ? `
            <a href="${primary.url}" target="_blank" rel="noopener noreferrer" class="device-link">
              前往官網 ${externalLinkIcon}
            </a>
          ` : ''}
        </div>
      </div>
      
      ${alternatives.length > 0 ? `
        <div class="alternatives">
          <h3 class="alternatives-title">其他選擇</h3>
          <div class="alternatives-grid">
            ${alternatives.map(alt => `
              <div class="device-card alternative">
                <h4 class="device-name">${alt.name}</h4>
                <p class="device-brand">${alt.brand}</p>
                <div class="device-specs">
                  <span class="spec">${alt.screenSize}"</span>
                  <span class="spec">NT$ ${alt.price.toLocaleString()}</span>
                </div>
                ${alt.url ? `
                  <a href="${alt.url}" target="_blank" rel="noopener noreferrer" class="device-link">
                    前往官網 ${externalLinkIcon}
                  </a>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${tip ? `
        <div class="tip-card">
          <span class="tip-icon">${icons['lightbulb'] || '💡'}</span>
          <p>${tip}</p>
        </div>
      ` : ''}
      
      <button class="restart-btn" onclick="location.reload()">
        ${icons['refresh'] || '🔄'} 重新測驗
      </button>
      
      <p class="source-note">資料參考：<a href="https://didadi.io/" target="_blank" rel="noopener noreferrer">DiDaDi 電子書閱讀器指南</a></p>
    </div>
  `;
}

export function renderLoading() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>分析中...</p>
    </div>
  `;
}

export function renderError(message) {
  const container = document.getElementById('quiz-container');
  container.innerHTML = `
    <div class="error-card">
      <span class="error-icon">${icons['alert-circle'] || '⚠️'}</span>
      <h2>發生錯誤</h2>
      <p>${message}</p>
      <button class="restart-btn" onclick="location.reload()">重新開始</button>
    </div>
  `;
}
