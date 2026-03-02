/**
 * 驗證 + 註冊模組
 */

const QUIZ_ANSWERS = { q1: 'C', q2: 'B' };

function initQuiz() {
  const btnSubmit = document.getElementById('btn-quiz-submit');
  const btnRegister = document.getElementById('btn-register-submit');
  const quizError = document.getElementById('quiz-error');
  const registerSelect = document.getElementById('register-name-select');
  const registerCustom = document.getElementById('register-name-custom');
  const registerDate = document.getElementById('register-date');

  // Set default date to today
  registerDate.value = new Date().toISOString().split('T')[0];

  // Populate member dropdown
  function populateMembers() {
    registerSelect.innerHTML = '<option value="">-- 選擇成員 --</option>';
    AppState.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.name;
      opt.textContent = m.name;
      registerSelect.appendChild(opt);
    });
  }

  // Quiz submit
  btnSubmit.addEventListener('click', () => {
    const q1 = document.querySelector('input[name="q1"]:checked');
    const q2 = document.querySelector('input[name="q2"]:checked');

    if (!q1 || !q2) {
      quizError.style.display = 'flex';
      quizError.querySelector('span').textContent = '請回答所有題目。';
      return;
    }

    if (q1.value === QUIZ_ANSWERS.q1 && q2.value === QUIZ_ANSWERS.q2) {
      // Pass! Show registration
      document.getElementById('quiz-step').style.display = 'none';
      document.getElementById('register-step').style.display = 'block';
      quizError.style.display = 'none';
      populateMembers();
    } else {
      quizError.style.display = 'flex';
      quizError.querySelector('span').textContent = '答案不正確，請再試一次。';
      // Reset selections
      document.querySelectorAll('input[name="q1"], input[name="q2"]').forEach(r => r.checked = false);
    }
  });

  // Mutual exclusion: select vs custom
  registerSelect.addEventListener('change', () => {
    if (registerSelect.value) registerCustom.value = '';
  });
  registerCustom.addEventListener('input', () => {
    if (registerCustom.value) registerSelect.value = '';
  });

  // Register submit
  btnRegister.addEventListener('click', () => {
    const name = registerSelect.value || registerCustom.value.trim();
    const date = registerDate.value;

    if (!name) {
      showToast('請選擇或填寫名字');
      return;
    }

    saveUser(name, date);
    closeModal('quiz-modal');
    showToast(`歡迎，${name}！已登記成功。`);

    // Reset modal state for next time
    document.getElementById('quiz-step').style.display = 'block';
    document.getElementById('register-step').style.display = 'none';
    document.querySelectorAll('input[name="q1"], input[name="q2"]').forEach(r => r.checked = false);

    // Execute pending auth callback
    if (AppState._authCallback) {
      AppState._authCallback();
      AppState._authCallback = null;
    }
  });

  // Close modal resets
  document.getElementById('quiz-modal-close').addEventListener('click', () => {
    document.getElementById('quiz-step').style.display = 'block';
    document.getElementById('register-step').style.display = 'none';
    quizError.style.display = 'none';
  });
}

window.initQuiz = initQuiz;
