/**
 * main.js - 入口與初始化
 * 電子書閱讀器選購測驗 v2.3.0
 */

import { renderQuiz, renderResult, renderError, updateOptionUI } from './render.js';
import { calculateRecommendation, getReasonText, getRelevantTip } from './recommendation.js';

// === 設定 ===
const DATA_PATH = './data';

// === 狀態 ===
let quizData = null;
let currentQuestion = 0;
let answers = {};
let app = null;

// === 資料載入 ===
async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

async function loadData() {
  const [meta, devices, questions, rules, tips] = await Promise.all([
    loadJSON(`${DATA_PATH}/meta.json`),
    loadJSON(`${DATA_PATH}/devices.json`),
    loadJSON(`${DATA_PATH}/questions.json`),
    loadJSON(`${DATA_PATH}/rules.json`),
    loadJSON(`${DATA_PATH}/tips.json`)
  ]);
  
  return {
    meta,
    devices,
    questions,
    rules,
    tips
  };
}

// === 使用者操作 ===
function selectOption(questionId, optionId, isMultiple) {
  if (isMultiple) {
    if (!answers[questionId]) {
      answers[questionId] = [];
    }
    const index = answers[questionId].indexOf(optionId);
    if (index > -1) {
      answers[questionId].splice(index, 1);
    } else {
      answers[questionId].push(optionId);
    }
  } else {
    answers[questionId] = optionId;
  }
  
  updateOptionUI(app, questionId, answers, isMultiple);
}

function nextQuestion() {
  if (currentQuestion < quizData.questions.length - 1) {
    currentQuestion++;
    renderCurrentQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    showResult();
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderCurrentQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function restart() {
  currentQuestion = 0;
  answers = {};
  renderCurrentQuiz();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === 渲染 ===
function renderCurrentQuiz() {
  renderQuiz(app, quizData, currentQuestion, answers, {
    onSelect: selectOption,
    onNext: nextQuestion,
    onPrev: prevQuestion
  });
}

function showResult() {
  const recommendation = calculateRecommendation(quizData.devices, quizData.rules, answers);
  const tip = getRelevantTip(quizData.tips, answers);
  
  renderResult(app, quizData, recommendation, answers, tip, {
    onRestart: restart
  });
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === 初始化 ===
async function init() {
  app = document.getElementById('app');
  
  try {
    quizData = await loadData();
    if (!quizData || !quizData.devices || !quizData.questions) {
      throw new Error('Invalid quiz data');
    }
    renderCurrentQuiz();
  } catch (error) {
    console.error('Failed to initialize quiz:', error);
    renderError(app);
  }
}

document.addEventListener('DOMContentLoaded', init);
